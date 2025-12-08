'use client';

import { useEffect, useRef, useState } from 'react';

interface Device {
  deviceId: string;
  label: string;
}

export default function PrinterMonitor() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const streams = useRef<{ [key: string]: MediaStream }>({});

  const requestPermission = async () => {
    setErrorMessage('');
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList
        .filter(device => device.kind === 'videoinput')
        .map(device => ({ deviceId: device.deviceId, label: device.label || `Camera ${device.deviceId.slice(0, 8)}` }));
      setDevices(videoDevices);
      setPermissionGranted(true);
    } catch (error: any) {
      console.error('Error enumerating devices:', error);
      setErrorMessage(`Failed to access cameras: ${error.message}`);
    }
  };

  useEffect(() => {
    return () => {
      Object.values(streams.current).forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
      });
    };
  }, []);

  const toggleDevice = async (deviceId: string) => {
    setErrorMessage('');
    const newSelected = new Set(selectedDevices);
    if (newSelected.has(deviceId)) {
      newSelected.delete(deviceId);
      if (streams.current[deviceId]) {
        streams.current[deviceId].getTracks().forEach(track => track.stop());
        delete streams.current[deviceId];
      }
    } else {
      if (newSelected.size >= 4) return;
      newSelected.add(deviceId);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } }
        });
        streams.current[deviceId] = stream;
        if (videoRefs.current[deviceId]) {
          videoRefs.current[deviceId].srcObject = stream;
        }
      } catch (error: any) {
        console.error('Error getting user media:', error);
        setErrorMessage(`Failed to access camera: ${error.message}`);
        newSelected.delete(deviceId);
      }
    }
    setSelectedDevices(newSelected);
  };

  const selectedArray = Array.from(selectedDevices);

  return (
    <div className="relative h-screen overflow-hidden mx-auto max-w-screen">
      {/* CCTV Grid - Full Screen Static 2x2 */}
      <div className="absolute inset-0 grid grid-cols-2 gap-1 p-1 pl-12">
        {Array.from({ length: 4 }, (_, index) => {
          const deviceId = selectedArray[index];
          return (
            <div key={index} className="relative aspect-video bg-black rounded">
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
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-sm p-2 rounded-b">
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

      {/* Sidebar Overlay */}
      <div className={`fixed top-0 left-0 h-full bg-black bg-opacity-75 backdrop-blur-sm transition-all duration-300 z-10 ${sidebarOpen ? 'w-[500px]' : 'w-12'}`}>
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
                    <p className="text-gray-400 text-sm">No cameras detected. Make sure Iriun is running and your phones are connected as virtual webcams.</p>
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
