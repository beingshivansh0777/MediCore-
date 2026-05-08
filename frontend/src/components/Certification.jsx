import React from "react";
import C3 from "../assets/C3.png";
import C1 from "../assets/C1.png";
import C2 from "../assets/C2.png";
import C4 from "../assets/C4.svg";
import C5 from "../assets/C5.png";
import C6 from "../assets/C6.png";
import C7 from "../assets/C7.svg";

const Certification = () => {
  const certifications = [
    { id: 1, name: "Medical Commission", image: C1, type: "international" },
    { id: 2, name: "Government Approved", image: C2, type: "government" },
    {
      id: 3,
      name: "NABH Accredited",
      image: C3,
      alt: "NABH Accreditation",
      type: "healthcare",
    },
    { id: 4, name: "Medical Council", image: C4, type: "government" },
    {
      id: 5,
      name: "Quality Healthcare",
      image: C5,
      alt: "Quality Healthcare",
      type: "healthcare",
    },
    {
      id: 6,
      name: "Paramedical Council",
      image: C6,
      alt: "Patient Safety",
      type: "healthcare",
    },
    {
      id: 7,
      name: "Ministry of Health",
      image: C7,
      alt: "Ministry of Health",
      type: "government",
    },
  ];

  const duplicatedCertifications = [
    ...certifications,
    ...certifications,
    ...certifications,
  ];

  return (
    <div className="relative py-6 bg-linear-to-br from-emerald-50 via-green-50 to-teal-50 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-br from-transparent via-green-400 to-transparent opacity-60">
          <div className="absolute inset-0 opacity-[0.02]">
            <div className="grid grid-cols-12 gap-4 w-full h-full">
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} className="border border-green-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="relative max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="absolute -left-20 top-1/2 w-16 h-0.5 bg-linear-to-br from-transparent to-green-400"></div>
            <div className="absolute -right-20 top-1/2 w-16 h-0.5 bg-linear-to-br from-transparent to-teal-400"></div>
            <h2 className="text-3xl lg:text-6xl font-serif text-gray-900 mb-4 tracking-tight">
              <span className="bg-linear-to-br from-green-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                CERTIFIED & EXCELLENCE
              </span>
            </h2>
          </div>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
            Government recognized and internationally accredited healthcare
            standards
          </p>
          <div className="inline-flex items-center px-5 py-2.5 bg-green-500/10 border border-green-400/30 rounded-full mt-6 backdrop-blur-sm">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse mr-3"></div>
            <span className="text-green-700 font-semibold tracking-wide text-sm">
              OFFICIALLY CERTIFIED
            </span>
          </div>
        </div>

        <div className="relative mb-10">
          <div className="relative p-4 mx-auto max-w-9xl">
            <div className="flex overflow-hidden">
              <div className="flex animate-marquee-single whitespace-nowrap py-3">
                {duplicatedCertifications.map((cert, index) => (
                  <div
                    key={`cert-${cert.id}-${index}`}
                    className="inline-flex flex-col items-center mx-10 transform transition-all duration-500 group"
                  >
                    <div className="relative">
                      <img
                        src={cert.image}
                        alt={cert.name}
                        className="w-16 h-16 object-contain filter transition-all duration-500"
                      />
                    </div>
                    <span className="mt-3 font-serif italic text-sm font-semibold text-gray-700 text-center max-w-30 leading-tight group-hover:text-green-700 transition-colors duration-300">
                      {cert.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
    @keyframes marquee-single {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-33.333%);
      }
    }
    .animate-marquee-single {
      animation: marquee-single 60s linear infinite;
    }
  `}
      </style>
    </div>
  );
};

export default Certification;
