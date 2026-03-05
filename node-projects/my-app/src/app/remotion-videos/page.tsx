export default function RemotionVideosPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl mb-4">Remotion Videos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
        <video autoPlay muted controls className="w-full h-auto">
          <source src={`video.mp4`} type="video/mp4" />
        </video>
        <a href={`/video.mp4`} target="_blank" rel="noopener noreferrer" className="">
          <p className="absolute top-0 text-center text-sm p-2 truncate">image compressor</p>
        </a>
        </div>
      </div>
    </div>
  );
}