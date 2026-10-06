import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import giftBox from "@/assets/gift-box.png";
import catCharacter from "@/assets/cat-character.png";
import pandaCharacter from "@/assets/panda-character.png";
import hamsterCharacter from "@/assets/hamster-character.png";
import Carousel3D from "./Carousel3D";
import { ConfettiEffect, celebrationConfetti } from "./ConfettiEffect";
import { ParticleBackground } from "./ParticleBackground";
import { Sparkles } from "lucide-react";

type Step = "gift" | "name" | "greeting" | "reveal" | "choice" | "gallery";

const BirthdayExperience = () => {
  const [step, setStep] = useState<Step>("gift");
  const [name, setName] = useState("");
  const [inputValue, setInputValue] = useState("");

  const handleNameSubmit = () => {
    if (inputValue.trim()) {
      setName(inputValue.trim());
      setStep("greeting");
    }
  };

  const handleCelebrate = () => {
    celebrationConfetti();
    setTimeout(() => {
      setStep("gallery");
    }, 500);
  };

  // Gift Step
  if (step === "gift") {
    return (
      <div className="min-h-screen bg-gradient-pink flex items-center justify-center p-4 overflow-x-hidden relative">
        <ParticleBackground />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute top-40 right-20 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="text-center animate-fade-in relative z-10">
          <div className="relative inline-block group">
            <div className="absolute inset-0 animate-pulse-glow rounded-full" />
            <div className="absolute -inset-4 bg-gradient-button opacity-20 rounded-full blur-xl group-hover:opacity-40 transition-opacity duration-300" />
            <button
              type="button"
              aria-label="Open birthday gift"
              onClick={() => setStep("name")}
              className="mx-auto mb-6 block rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <img
                src={giftBox}
                alt=""
                className="h-48 w-48 animate-bounce-soft transition-transform duration-300 hover:scale-110 drop-shadow-2xl"
              />
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Sparkles className="w-6 h-6 text-accent animate-pulse" />
            <p className="text-2xl font-bold text-card bg-clip-text">
              Open the gift, cutie
            </p>
            <Sparkles className="w-6 h-6 text-accent animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          <p className="text-sm text-card/70 mt-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            Tap the gift to begin your special journey
          </p>
        </div>
      </div>
    );
  }

  // Name Input Step
  if (step === "name") {
    return (
      <div className="min-h-screen bg-gradient-pink flex items-center justify-center p-4 relative overflow-x-hidden">
        <ParticleBackground />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        </div>
          <Card className="p-8 max-w-sm w-full shadow-card animate-scale-in bg-card/95 border border-white/10 backdrop-blur-xl relative z-10 hover:shadow-[0_18px_48px_rgba(69,25,43,0.3)] transition-shadow duration-500">
          <div className="absolute inset-0 bg-gradient-card opacity-50 rounded-lg" />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-accent animate-pulse" />
              <h2 className="text-2xl font-bold text-center text-card-foreground animate-fade-in-up">
                What's your beautiful name?
              </h2>
              <Sparkles className="w-5 h-5 text-accent animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  aria-label="Your name"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                  placeholder="Enter your name"
                  className="text-center text-lg border-2 bg-white/95 text-card border-card-foreground/20 focus:border-primary focus:bg-white placeholder:text-muted-foreground/60 transition-all duration-300 focus:scale-105 animate-fade-in-up focus:shadow-glow"
                  style={{ animationDelay: '0.2s' }}
                  autoFocus
                />
              </div>
              <Button
                onClick={handleNameSubmit}
                className="w-full bg-gradient-button hover:opacity-90 text-primary-foreground font-semibold py-5 text-base rounded-full shadow-button border-0 transition-all duration-300 hover:scale-105 hover:shadow-glow animate-fade-in-up relative overflow-hidden group"
                style={{ animationDelay: '0.4s' }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Continue <Sparkles className="w-4 h-4" />
                </span>
                <div className="absolute inset-0 bg-shimmer bg-[length:200%_100%] opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Greeting Step
  if (step === "greeting") {
    return (
      <div className="min-h-screen bg-gradient-pink flex items-center justify-center p-4 relative overflow-x-hidden">
        <ConfettiEffect />
        <ParticleBackground />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-20 w-24 h-24 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-20 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-10 w-20 h-20 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="text-center animate-fade-in space-y-4 relative z-10 max-w-3xl w-full scale-90">
          <div className="relative inline-block group">
            <div className="absolute inset-0 animate-pulse-glow rounded-full" />
            <div className="absolute -inset-8 bg-gradient-accent opacity-20 rounded-full blur-2xl group-hover:opacity-40 transition-opacity duration-500" />
            <img
              src={catCharacter}
              alt="Cute cat"
              className="w-32 h-32 mx-auto animate-float drop-shadow-2xl relative z-10"
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="inline-flex items-center gap-2 text-3xl md:text-4xl font-bold text-card mb-2">
              <span className="animate-bounce-soft">🎉</span>
              <span>Happy Birthday, {name}!</span>
              <span className="animate-bounce-soft" style={{ animationDelay: '0.5s' }}>🎉</span>
            </div>
          </div>
          <Card className="p-5 max-w-xl mx-auto bg-card/95 text-card-foreground shadow-card border border-white/10 animate-scale-in backdrop-blur-xl hover:shadow-[0_18px_48px_rgba(69,25,43,0.3)] transition-shadow duration-500 relative overflow-hidden" style={{ animationDelay: '0.5s' }}>
            <div className="absolute inset-0 bg-gradient-card opacity-50" />
            <div className="relative z-10">
              <p className="text-base md:text-lg leading-relaxed mb-3">
                Happy Birthday, gorgeous! Today is all about celebrating you. 🌟
              </p>
              <Button
                onClick={() => setStep("reveal")}
                className="mt-2 bg-gradient-accent hover:opacity-90 text-accent-foreground font-semibold px-6 py-3 text-sm md:text-base rounded-full shadow-button border-0 transition-all duration-300 hover:scale-105 hover:shadow-glow relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Continue the journey <Sparkles className="w-4 h-4" />
                </span>
                <div className="absolute inset-0 bg-shimmer bg-[length:200%_100%] opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Reveal Step
  if (step === "reveal") {
    return (
      <div className="min-h-screen bg-gradient-pink flex items-center justify-center p-4 relative overflow-x-hidden">
        <ParticleBackground />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-10 w-28 h-28 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 left-10 w-36 h-36 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.2s' }} />
          <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2.4s' }} />
        </div>
        <div className="text-center animate-fade-in space-y-6 relative z-10 max-w-lg">
          <div className="relative inline-block group">
            <div className="absolute inset-0 animate-pulse-glow rounded-full" />
            <div className="absolute -inset-10 bg-gradient-button opacity-20 rounded-full blur-2xl group-hover:opacity-40 transition-opacity duration-500" />
            <img
              src={pandaCharacter}
              alt="Cute panda"
              className="w-44 h-44 mx-auto animate-float drop-shadow-2xl relative z-10"
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="inline-flex items-center gap-3 text-4xl font-bold text-card mb-3">
              <span className="animate-bounce-soft">🎂</span>
              <span>Happy Birthday, {name}!</span>
              <span className="animate-bounce-soft" style={{ animationDelay: '0.5s' }}>🎂</span>
            </div>
          </div>
          <Card className="p-7 max-w-md bg-card/95 text-card-foreground shadow-card border border-white/10 animate-scale-in backdrop-blur-xl hover:shadow-[0_18px_48px_rgba(69,25,43,0.3)] transition-shadow duration-500 relative overflow-hidden" style={{ animationDelay: '0.5s' }}>
            <div className="absolute inset-0 bg-gradient-card opacity-50" />
            <div className="relative z-10 space-y-4">
              <p className="text-xl font-semibold flex items-center justify-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                <Sparkles className="w-5 h-5 text-accent" />
                Do you know what makes today extra special?
                <Sparkles className="w-5 h-5 text-accent" />
              </p>
              <p className="text-2xl font-bold text-accent animate-scale-in" style={{ animationDelay: '0.9s' }}>
                It's your birthday! 🎉
              </p>
              <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
              <p className="text-base leading-relaxed animate-fade-in-up" style={{ animationDelay: '1.1s' }}>
                Today, I wish you a year filled with laughter, love, and
                unforgettable moments. 🎁
              </p>
              <p className="text-base leading-relaxed animate-fade-in-up" style={{ animationDelay: '1.3s' }}>
                Remember, you deserve every happiness in the world. Celebrate big
                and enjoy every moment! 🌈
              </p>
            </div>
          </Card>
          <Button
            onClick={() => setStep("choice")}
            className="bg-gradient-accent hover:opacity-90 text-accent-foreground font-semibold px-8 py-5 text-lg rounded-full shadow-button border-0 transition-all duration-300 hover:scale-105 hover:shadow-glow animate-fade-in-up relative overflow-hidden group"
            style={{ animationDelay: '1.5s' }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Continue <Sparkles className="w-4 h-4" />
            </span>
            <div className="absolute inset-0 bg-shimmer bg-[length:200%_100%] opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
          </Button>
        </div>
      </div>
    );
  }

  // Choice Step
  if (step === "choice") {
    return (
      <div className="min-h-screen bg-gradient-pink flex items-center justify-center p-4 relative overflow-x-hidden">
        <ParticleBackground />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-28 h-28 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-1/4 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/3 right-10 w-24 h-24 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <Card className="p-8 max-w-sm w-full shadow-card animate-scale-in bg-card/95 border border-white/10 backdrop-blur-xl relative z-10 hover:shadow-[0_18px_48px_rgba(69,25,43,0.3)] transition-shadow duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-card opacity-50" />
          <div className="relative z-10">
            <div className="relative inline-block mx-auto w-fit mb-6 group">
              <div className="absolute inset-0 animate-pulse-glow rounded-full" />
              <div className="absolute -inset-6 bg-gradient-accent opacity-20 rounded-full blur-xl group-hover:opacity-40 transition-opacity duration-500" />
              <img
                src={hamsterCharacter}
                alt="Cute hamster"
                className="w-32 h-32 mx-auto animate-wiggle drop-shadow-2xl relative z-10"
              />
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent animate-pulse" />
              <h2 className="text-xl font-bold text-center text-card-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                {name}, How about we celebrate in style?
              </h2>
              <Sparkles className="w-5 h-5 text-accent animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
            <p className="text-center text-card-foreground/80 mb-6 text-base animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              Your choice is:
            </p>
            <div className="space-y-4">
              <Button
                onClick={handleCelebrate}
                className="w-full bg-gradient-button hover:opacity-90 text-primary-foreground font-semibold py-5 text-lg rounded-full shadow-button border-0 transition-all duration-300 hover:scale-105 hover:shadow-glow animate-fade-in-up relative overflow-hidden group"
                style={{ animationDelay: '0.6s' }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>Absolutely, let's celebrate!</span>
                  <span className="animate-bounce-soft">🎉</span>
                </span>
                <div className="absolute inset-0 bg-shimmer bg-[length:200%_100%] opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
              </Button>
              <Button
                onClick={handleCelebrate}
                variant="destructive"
                className="w-full font-semibold py-5 text-lg rounded-full shadow-button border-0 transition-all duration-300 hover:scale-105 animate-fade-in-up"
                style={{ animationDelay: '0.8s' }}
              >
                Maybe another time 😔
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Gallery Step
  if (step === "gallery") {
    return <Carousel3D name={name} />;
  }

  return null;
};

export default BirthdayExperience;
