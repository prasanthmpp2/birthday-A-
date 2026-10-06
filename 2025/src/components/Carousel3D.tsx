import { useEffect, useState, type CSSProperties } from "react";
import photo9 from "@/assets/photos/photo9.jpg";
import photo10 from "@/assets/photos/photo10.jpg";
import photo11 from "@/assets/photos/photo11.jpg";
import photo12 from "@/assets/photos/photo12.jpg";
import photo13 from "@/assets/photos/photo13.jpg";
import photo14 from "@/assets/photos/photo14.jpg";
import photo15 from "@/assets/photos/photo15.jpg";
import photo16 from "@/assets/photos/photo16.jpg";
import photo17 from "@/assets/photos/photo17.jpg";
import photo18 from "@/assets/photos/photo18.jpg";
import "./Carousel3D.css";
import { ConfettiEffect } from "./ConfettiEffect";
import { ParticleBackground } from "./ParticleBackground";
import { Heart } from "lucide-react";

const photos = [photo9, photo10, photo11, photo12, photo13, photo14, photo15, photo16, photo17, photo18];

interface Carousel3DProps {
  name: string;
}

const Carousel3D = ({ name }: Carousel3DProps) => {
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Calculate the rotation angle for each photo
  const photoCount = photos.length;
  const angleIncrement = 360 / photoCount;

  useEffect(() => {
    // Start animation after component mounts
    const timer = setTimeout(() => {
      setIsPlaying(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-pink flex flex-col items-center justify-center px-4 py-8 overflow-x-hidden relative">
      <ConfettiEffect />
      <ParticleBackground />
      
      <div className="mx-auto w-full max-w-3xl text-center mb-6 sm:mb-8 animate-fade-in z-10">
        <div className="mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4">
          <Heart className="w-8 h-8 text-accent fill-accent animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-bold text-card drop-shadow-2xl">
            Happy Birthday {name}!
          </h1>
          <Heart className="w-8 h-8 text-accent fill-accent animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        
        <div className="mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-2 text-base md:text-xl text-card/90 animate-fade-in-up px-4 sm:px-6 py-3 bg-card/20 backdrop-blur-sm rounded-full" style={{ animationDelay: '0.2s' }}>
          <span className="animate-bounce-soft">🎊</span>
          <p>Here's a collection of beautiful memories, spinning just for you</p>
          <span className="animate-bounce-soft" style={{ animationDelay: '0.3s' }}>✨</span>
        </div>
      </div>
      
      <div className="carousel-perspective animate-scale-in z-10 relative" style={{ animationDelay: '0.4s' }}>
        <div className={`carousel-container ${isPlaying ? 'spinning' : ''} relative z-10`}>
          {photos.map((photo, index) => {
            const rotateY = angleIncrement * index;
            return (
              <div
                key={index}
                className="carousel-photo group"
                style={{
                  transform: `rotateY(${rotateY}deg) translateZ(var(--carousel-radius))`,
                  "--carousel-radius": "clamp(80px, 22vw, 260px)",
                } as CSSProperties}
              >
                <img
                  src={photo}
                  alt={`Memory ${index + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default Carousel3D;
