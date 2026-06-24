import { ReactNode, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import primeLogo from "@/logo prime.jpeg";
import authBg from "@/assets/auth-bg.png";

/** Bundled clip: frontend/public/videos/insurance-login.mp4 */
const VIDEO_SOURCES = [
  "/videos/insurance-login.mp4",
  "https://assets.mixkit.co/videos/22977/22977-720.mp4",
  "https://videos.pexels.com/video-files/3195396/3195396-sd_640_360_25fps.mp4"
];

interface LoginVideoLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const LoginVideoLayout = ({ title, description, children }: LoginVideoLayoutProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const play = () => {
      void video.play().catch(() => {
        /* autoplay blocked until user gesture — poster still visible */
      });
    };

    play();
    video.addEventListener("canplay", play);
    return () => video.removeEventListener("canplay", play);
  }, []);

  return (
    <div className="login-video-page">
      <video
        ref={videoRef}
        className="login-video-bg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={authBg}
        aria-hidden
      >
        {VIDEO_SOURCES.map((src) => (
          <source key={src} src={src} type="video/mp4" />
        ))}
      </video>
      <div className="login-video-overlay" aria-hidden />

      <div className="login-video-center">
        <div className="login-video-card">
          <Link to="/" className="mb-5 flex justify-center">
            <img src={primeLogo} alt="Prime Insurance" className="h-11 w-auto" />
          </Link>
          <h1 className="text-center text-2xl font-extrabold text-navy-900">{title}</h1>
          {description ? (
            <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">{description}</p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
        <p className="login-video-tagline">Prime Life Insurance — Secure Tomorrow Today</p>
      </div>
    </div>
  );
};
