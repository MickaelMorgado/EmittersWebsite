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
  const [viewCount, setViewCount] = useState<number>(4);
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

  const getGridClasses = () => {
    switch (viewCount) {
      case 1: return 'grid-cols-1 grid-rows-1';
      case 2: return 'grid-cols-1 sm:grid-cols-2 grid-rows-2 sm:grid-rows-1';
      case 3:
      case 4: return 'grid-cols-2 grid-rows-2';
      default: return 'grid-cols-2 grid-rows-2';
    }
  };

  return (
    <div className="relative h-screen overflow-hidden mx-auto max-w-screen bg-black">
      {/* CCTV Grid - Dynamic Layout */}
      <div className={`absolute inset-0 grid ${getGridClasses()} h-full gap-1 p-1 pl-12 transition-all duration-500 ease-in-out`}>
        {Array.from({ length: viewCount }, (_, index) => {
          const deviceId = selectedArray[index];
          return (
            <div key={index} className="relative bg-zinc-900 rounded overflow-hidden group border border-white/5">
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
                    playsInline
                    className="w-full h-full object-cover rounded overflow-hidden"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-sm p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="font-medium opacity-90">
                      {devices.find(d => d.deviceId === deviceId)?.label || `Camera ${deviceId.slice(0, 8)}`}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-600/80 text-[10px] font-bold text-white rounded uppercase tracking-wider animate-pulse">
                    Live
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
                    <span className="text-lg">?</span>
                  </div>
                  <span className="text-sm font-medium">Slot {index + 1} Empty</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        title="Printer Monitor"
      >
        {errorMessage && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-lg">
            {errorMessage}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Display Layout</h2>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setViewCount(n)}
                className={`py-3 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                  viewCount === n 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:border-zinc-600'
                }`}
              >
                <span className="text-lg font-bold">{n}</span>
                <span className="text-[10px] uppercase opacity-60">View</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Available Cameras</h2>
            {permissionGranted && (
              <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded-full border border-zinc-700">
                {devices.length} Found
              </span>
            )}
          </div>
          
          {!permissionGranted ? (
            <button
              onClick={requestPermission}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              Initialize Cameras
            </button>
          ) : (
            <div className="space-y-2">
              {devices.length === 0 ? (
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
                  <p className="text-zinc-500 text-xs">No cameras detected. Ensure virtual webcam software (like Iriun) is running.</p>
                </div>
              ) : (
                devices.map(device => (
                  <label 
                    key={device.deviceId} 
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedDevices.has(device.deviceId)
                        ? 'bg-zinc-800 border-blue-500/50 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDevices.has(device.deviceId)}
                      onChange={() => toggleDevice(device.deviceId)}
                      className="hidden"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${
                      selectedDevices.has(device.deviceId) ? 'border-blue-500 bg-blue-500' : 'border-zinc-700'
                    }`}>
                      {selectedDevices.has(device.deviceId) && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-sm truncate font-medium">{device.label}</span>
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
