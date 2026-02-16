'use client';

import { useEffect, useRef, useState } from 'react';
import Sidebar from '../../components/sidebar';

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
    const currentStreams = streams.current;
    return () => {
      Object.values(currentStreams).forEach(stream => {
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
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 h-full gap-1 p-1 pl-12">
        {Array.from({ length: 4 }, (_, index) => {
          const deviceId = selectedArray[index];
          return (
            <div key={index} className="relative bg-black rounded">
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
                    className="w-full h-full object-cover rounded overflow-hidden"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-black via-transparent to-transparent text-white text-sm p-2 rounded-b">
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

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        title="3D Printer Camera Monitor"
      >
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
      </Sidebar>
    </div>
  );
}
