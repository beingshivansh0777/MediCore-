import { Star } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const Testimonial = () => {
  const scrollRefLeft = useRef(null);
  const scrollRefRight = useRef(null);
  const [isPausedLeft, setIsPausedLeft] = useState(false);
  const [isPausedRight, setIsPausedRight] = useState(false);

  const testimonials = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      role: "Cardiologist",
      rating: 5,
      text: "The appointment booking system is incredibly efficient. It saves me valuable time and helps me focus on patient care.",
      image:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Patient",
      rating: 5,
      text: "Scheduling appointments has never been easier. The interface is intuitive and reminders are very helpful!",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
    {
      id: 3,
      name: "Dr. Robert Martinez",
      role: "Pediatrician",
      rating: 4,
      text: "This platform has streamlined our clinic operations significantly. Patient management is much more organized.",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 4,
      name: "Emily Williams",
      role: "Patient",
      rating: 5,
      text: "Booking appointments online 24/7 is a game-changer. The confirmation system gives me peace of mind.",
      image:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
    {
      id: 5,
      name: "Dr. Amanda Lee",
      role: "Dermatologist",
      rating: 5,
      text: "Excellent platform for managing appointments. Automated reminders reduce no-shows dramatically.",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 6,
      name: "David Thompson",
      role: "Patient",
      rating: 5,
      text: "The wait time has reduced significantly since using this platform. Very convenient and user-friendly!",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
  ];

  const leftTestimonials = testimonials.filter((t) => t.type === "doctor");
  const rightTestimonials = testimonials.filter((t) => t.type === "patient");

  useEffect(() => {
    const scrollLeft = scrollRefLeft.current;
    const scrollRight = scrollRefRight.current;
    if (!scrollLeft || !scrollRight) return;

    let scrollSpeed = 0.5; // preserved animation speed
    let rafId;

    const smoothScroll = () => {
      if (!isPausedLeft) {
        scrollLeft.scrollTop += scrollSpeed;
        if (scrollLeft.scrollTop >= scrollLeft.scrollHeight / 2) {
          scrollLeft.scrollTop = 0;
        }
      }

      if (!isPausedRight) {
        scrollRight.scrollTop -= scrollSpeed;
        if (scrollRight.scrollTop <= 0) {
          scrollRight.scrollTop = scrollRight.scrollHeight / 2;
        }
      }

      rafId = requestAnimationFrame(smoothScroll);
    };

    rafId = requestAnimationFrame(smoothScroll);
    return () => cancelAnimationFrame(rafId);
  }, [isPausedLeft, isPausedRight]);

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < rating ? "text-yellow-400" : "text-gray-300"}
      >
        <Star className="w-4 h-4 inline-block" />
      </span>
    ));

  const TestimonialCard = ({ testimonial, direction }) => (
    <div
      className={`bg-white font-[pacifico] rounded-xl shadow-lg p-4 sm:p-5 mb-4 transition-transform duration-300 border-l-4 w-full max-w-xl mx-auto${
        direction === "left"
          ? "border-blue-400 hover:shadow-blue-100"
          : "border-green-400 hover:shadow-green-100"
      }`}
    >
      <div className="flex items-start space-x-3 sm:space-x-4">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-full border border-gray-200 shadow-sm"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4
                className={`font-semibold text-sm sm:text-base ${
                  direction === "left" ? "text-blue-800" : "text-green-800"
                }`}
              >
                {testimonial.name}
              </h4>
              <p className="text-xs sm:text-sm text-gray-600">
                {testimonial.role}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              {renderStars(testimonial.rating)}
            </div>
          </div>

          <p className="text-gray-700 italic text-sm sm:text-base mt-2 leading-tight">
            "{testimonial.text}"
          </p>

          {/* Stars on small screens beneath text */}
          <div className="flex sm:hidden mt-3">
            {renderStars(testimonial.rating)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[70vh] bg-linear-to-br from-slate-50 to-blue-50 py-10 px-4 relative overflow-hidden">
      <div className="max-w-6xl font-serif mx-auto text-center mb-8 sm:mb-12">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-linear-to-br from-blue-600 to-green-600 mb-3">
          Voices of Trust
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto">
          Real stories from doctors and patients sharing their positive
          experiences with out healthcare platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
        <div
          className="relative font-serif border-2 rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm border-blue-200"
          onMouseEnter={() => setIsPausedLeft(true)}
          onMouseLeave={() => setIsPausedLeft(false)}
        >
          <div className="py-2 font-semibold text-md sm:text-lg rounded-t-2xl text-center bg-blue-100 text-blue-700">
            👩‍⚕️ Medical Professionals
          </div>

          <div
            ref={scrollRefLeft}
            className="h-56 sm:h-72 md:h-88 lg:h-104 overflow-y-hidden no-scrollbar p-3 sm:p-4"
            onTouchStart={() => setIsPausedLeft(true)}
            onTouchEnd={() => setIsPausedLeft(false)}
          >
            {[...leftTestimonials, ...leftTestimonials].map((t, i) => (
              <TestimonialCard
                key={`L-${i}`}
                testimonial={t}
                direction="left"
              />
            ))}
          </div>
        </div>

        <div
          className="relative font-serif border-2 rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm border-blue-200"
          onMouseEnter={() => setIsPausedRight(true)}
          onMouseLeave={() => setIsPausedRight(false)}
        >
          <div className="py-2 font-semibold text-md sm:text-lg rounded-t-2xl text-center bg-green-100 text-green-700">
            🧑‍💼 Patients
          </div>
          <div
            ref={scrollRefRight}
            className="h-56 sm:h-72 md:h-88 lg:h-104 overflow-y-hidden no-scrollbar p-3 sm:p-4"
            onTouchStart={() => setIsPausedRight(true)}
            onTouchEnd={() => setIsPausedRight(false)}
          >
            {[...rightTestimonials, ...rightTestimonials].map((t, i) => (
              <TestimonialCard
                key={`R-${i}`}
                testimonial={t}
                direction="right"
              />
            ))}
          </div>
        </div>
      </div>
      <style>
        {`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    
    /* subtle responsive tweaks */
    @media (max-width: 640px) {
      .min-h-[70vh] { min-height: auto; }
    }
    
    /* Respect reduced motion */
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; transition: none !important; }
    }
  `}
      </style>
    </div>
  );
};

export default Testimonial;
