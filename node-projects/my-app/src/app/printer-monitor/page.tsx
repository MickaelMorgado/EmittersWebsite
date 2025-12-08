'use client';

import { useState, useEffect, useRef } from 'react';

interface Device {
  deviceId: string;
  label: string;
}

export default function PrinterMonitor() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [mainDeviceId, setMainDeviceId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const mainVideoRef = useRef<HTMLVideoElement>(null);
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
      setErrorMessage(`Failed to get camera permission: ${error.message}`);
    }
  };

  useEffect(() => {
    if (mainVideoRef.current && mainDeviceId && streams.current[mainDeviceId]) {
      mainVideoRef.current.srcObject = streams.current[mainDeviceId];
    }
  }, [mainDeviceId]);

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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">3D Printer Camera Monitor</h1>
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-600 text-white rounded">
          {errorMessage}
        </div>
      )}

      {/* Settings Panel */}
      <div className="mb-8">
        <h2 className="text-xl mb-2">Available Cameras</h2>
        {!permissionGranted ? (
          <button
            onClick={requestPermission}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Grant Camera Permission
          </button>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {devices.map(device => (
              <label key={device.deviceId} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedDevices.has(device.deviceId)}
                  onChange={() => toggleDevice(device.deviceId)}
                />
                <span>{device.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Main Video */}
      <div className="mb-4">
        <h2 className="text-xl mb-2">Main Preview</h2>
        <video
          ref={mainVideoRef}
          autoPlay
          muted
          className="w-full max-w-4xl h-96 bg-black"
        />
      </div>

      {/* Grid of Videos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from(selectedDevices).map(deviceId => (
          <div key={deviceId} className="cursor-pointer" onClick={() => setMain(deviceId)}>
            <video
              ref={el => {
                if (el) videoRefs.current[deviceId] = el;
                if (el && streams.current[deviceId]) {
                  el.srcObject = streams.current[deviceId];
                }
              }}
              autoPlay
              muted
              className={`w-full h-24 bg-black ${mainDeviceId === deviceId ? 'border-2 border-blue-500' : ''}`}
            />
            <p className="text-sm mt-1">{devices.find(d => d.deviceId === deviceId)?.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
