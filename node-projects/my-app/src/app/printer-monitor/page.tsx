'use client';

import { useEffect, useRef, useState } from 'react';

interface Device {
  deviceId: string;
  label: string;
}

export default function PrinterMonitor() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [mainDeviceId, setMainDeviceId] = useState<string>(''); // Keep for API, but not used in UI
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [presentationMode, setPresentationMode] = useState<'grid' | 'loop'>('grid');
  const [currentLoopIndex, setCurrentLoopIndex] = useState<number>(0);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const streams = useRef<{ [key: string]: MediaStream }>({});

  const selectedArray = Array.from(selectedDevices);

  const requestPermission = async () => {
    setErrorMessage('');
    try {
      // Request permission by opening a temporary stream
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Immediately stop it
      tempStream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      // Now enumerate devices
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList
        .filter(device => device.kind === 'videoinput')
        .map(device => ({ deviceId: device.deviceId, label: device.label || `Camera ${device.deviceId.slice(0, 8)}` }));
      setDevices(videoDevices);
    } catch (error: any) {
      console.error('Error requesting permission:', error);
      if (error.name === 'NotFoundError') {
        setErrorMessage('No camera devices found. Make sure Iriun is running and your phones are connected as virtual webcams.');
      } else {
        setErrorMessage(`Failed to get camera permission: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (presentationMode === 'loop' && selectedArray.length > 1) {
      interval = setInterval(() => {
        setCurrentLoopIndex(prev => (prev + 1) % selectedArray.length);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
      // Cleanup streams on unmount
      Object.values(streams.current).forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
      });
    };
  }, [presentationMode, selectedArray.length]);

  // Update loop video srcObject when device changes
  useEffect(() => {
    if (presentationMode === 'loop' && selectedArray.length > 0) {
      const currentDeviceId = selectedArray[currentLoopIndex];
      const loopVideoRef = videoRefs.current['loop'];
      if (loopVideoRef && streams.current[currentDeviceId]) {
        loopVideoRef.srcObject = streams.current[currentDeviceId];
        loopVideoRef.play().catch(console.error);
      }
    }
  }, [presentationMode, currentLoopIndex, selectedArray]);

  const toggleDevice = async (deviceId: string) => {
    setErrorMessage(''); // Clear previous error
    const newSelected = new Set(selectedDevices);
    if (newSelected.has(deviceId)) {
      // Deselect
      newSelected.delete(deviceId);
      if (streams.current[deviceId]) {
        streams.current[deviceId].getTracks().forEach(track => track.stop());
        delete streams.current[deviceId];
      }
      if (mainDeviceId === deviceId) {
        setMainDeviceId('');
      }
    } else {
      // Select
      if (newSelected.size >= 4) return; // Max 4
      newSelected.add(deviceId);
      // Add delay to prevent racing conditions
      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } }
          });
          streams.current[deviceId] = stream;
          // Set srcObject for grid mode video
          if (videoRefs.current[deviceId]) {
            videoRefs.current[deviceId].srcObject = stream;
          }
          // Set srcObject for loop mode video if this is the current camera
          if (presentationMode === 'loop') {
            const currentDeviceId = selectedArray[currentLoopIndex];
            if (currentDeviceId === deviceId && videoRefs.current['loop']) {
              videoRefs.current['loop'].srcObject = stream;
              videoRefs.current['loop'].play().catch(console.error);
            }
          }
          if (!mainDeviceId) {
            setMainDeviceId(deviceId);
          }
          // Re-enumerate to get labels now that permission is granted
          const deviceList = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = deviceList
            .filter(device => device.kind === 'videoinput')
            .map(device => ({ deviceId: device.deviceId, label: device.label || `Camera ${device.deviceId.slice(0, 8)}` }));
          setDevices(videoDevices);
        } catch (error: any) {
          console.error('Error getting user media:', error);
          setErrorMessage(`Failed to access camera: ${error.message}. Make sure no other application is using this camera.`);
          // Revert selection
          setSelectedDevices(prev => {
            const updated = new Set(prev);
            updated.delete(deviceId);
            return updated;
          });
        }
      }, 1000); // 1000ms delay
    }
    setSelectedDevices(newSelected);
  };

  const setMain = async (deviceId: string) => {
    setMainDeviceId(deviceId);
    // Call API
    try {
      await fetch('/api/main-camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });
    } catch (error) {
      console.error('Error setting main camera:', error);
    }
  };

  const gridCols = Math.min(selectedArray.length, 4); // 1 to 4 columns

  return (
    <div className="relative min-h-screen">
      {/* CCTV Display */}
      {selectedArray.length > 0 && (
        presentationMode === 'loop' ? (
          // Loop mode: single camera full screen
          <div className="absolute inset-0 pl-12">
            <div className="relative w-full h-full bg-black">
              <video
                ref={el => {
                  if (el) videoRefs.current['loop'] = el;
                }}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-lg p-4">
                {selectedArray.length > 0 ? (devices.find(d => d.deviceId === selectedArray[currentLoopIndex])?.label || `Camera ${selectedArray[currentLoopIndex].slice(0, 8)}`) : ''}
              </div>
            </div>
          </div>
        ) : (
          // Grid mode - static 2x2 grid
          <div className="absolute inset-0 grid grid-cols-2 gap-1 p-1 pl-12">
            {Array.from({ length: 4 }, (_, index) => {
              const deviceId = selectedArray[index];
              return (
                <div key={index} className="relative aspect-video bg-[rgba(0,0,0,0.75)] rounded">
                  {deviceId && streams.current[deviceId] ? (
                    <>
                      <video
                        ref={el => {
                          if (el) videoRefs.current[deviceId] = el;
                          if (el && streams.current[deviceId]) {
                            el.srcObject = streams.current[deviceId];
                          }
                        }}
                        autoPlay
                        muted
                        className="w-full h-full object-cover rounded"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-[rgba(0,0,0,0.75)] text-white text-sm p-2 rounded-b">
                        {devices.find(d => d.deviceId === deviceId)?.label || `Camera ${deviceId.slice(0, 8)}`}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-2xl">
                      Camera {index + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Sidebar Overlay */}
      <div className={`fixed top-0 left-0 h-full bg-[rgba(0,0,0,0.9)] backdrop-blur-sm transition-all duration-300 z-10 ${sidebarOpen ? 'w-[500px]' : 'w-12'}`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 right-2 w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>

        {sidebarOpen && (
          <div className="p-4 pt-16 text-white">
            <h1 className="text-xl font-bold mb-4">3D Printer Camera Monitor</h1>
            {errorMessage && (
              <div className="mb-4 p-4 bg-red-600 text-white rounded">
                {errorMessage}
              </div>
            )}

            {/* Presentation Mode */}
            <div className="mb-6">
              <h2 className="text-lg mb-2">Presentation Mode</h2>
              <select
                value={presentationMode}
                onChange={(e) => setPresentationMode(e.target.value as 'grid' | 'loop')}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
              >
                <option value="grid">Grid Display</option>
                <option value="loop">Dynamic Loop</option>
              </select>
            </div>

            {/* Settings Panel */}
            <div className="mb-8">
              <h2 className="text-lg mb-2">Available Cameras ({devices.length} found)</h2>
              {!permissionGranted ? (
                <button
                  onClick={requestPermission}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Grant Camera Permission
                </button>
              ) : (
                <div className="space-y-2">
                  {devices.length === 0 ? (
                    <p className="text-gray-400 text-sm">No cameras detected. Make sure Iriun is running and cameras are connected.</p>
                  ) : (
                    devices.map(device => (
                      <label key={device.deviceId} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedDevices.has(device.deviceId)}
                          onChange={() => toggleDevice(device.deviceId)}
                          className="w-4 h-4"
                        />
                        <span className="truncate">{device.label || `Camera ${device.deviceId.slice(0, 8)}`}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
