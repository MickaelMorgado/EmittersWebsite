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
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const streams = useRef<{ [key: string]: MediaStream }>({});

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
    return () => {
      // Cleanup streams on unmount
      Object.values(streams.current).forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
      });
    };
  }, []);

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
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } }
        });
        streams.current[deviceId] = stream;
        if (videoRefs.current[deviceId]) {
          videoRefs.current[deviceId].srcObject = stream;
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
        newSelected.delete(deviceId); // Revert selection
      }
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

  const selectedArray = Array.from(selectedDevices);
  const gridCols = Math.min(selectedArray.length, 4); // 1 to 4 columns

  return (
    <div className="relative min-h-screen">
      {/* CCTV Grid - Full Screen Background */}
      {selectedArray.length > 0 && (
        <div className={`absolute inset-0 grid gap-1 p-1 ${gridCols === 1 ? 'grid-cols-1' : gridCols === 2 ? 'grid-cols-1 md:grid-cols-2' : gridCols === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
          {selectedArray.map(deviceId => (
            <div key={deviceId} className="relative aspect-video bg-black rounded">
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
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-sm p-2 rounded-b">
                {devices.find(d => d.deviceId === deviceId)?.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sidebar Overlay */}
      <div className={`fixed top-0 left-0 h-full bg-black bg-opacity-75 transition-all duration-300 z-10 ${sidebarOpen ? 'w-72' : 'w-12'}`}>
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
