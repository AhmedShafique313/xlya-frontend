"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "@/components/snakbar";
import Button from "@/components/common/Button";

const Contact = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.2,
        rootMargin: "-50px",
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong. Please try again.");
      } else {
        toast.success("Message sent! We'll get back to you soon.");
        setFormData({ fullName: "", email: "", subject: "", message: "" });
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const contactInfo = [
    {
      number: "01",
      title: "Email",
      value: "support@xlya.com",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      number: "02",
      title: "Location",
      value: "Available Worldwide | Access via Web",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const fields: {
    name: keyof typeof formData;
    label: string;
    placeholder: string;
    type: string;
    icon: React.ReactNode;
  }[] = [
    {
      name: "fullName",
      label: "Full Name",
      placeholder: "Full Name",
      type: "text",
      icon: (
        <svg className="w-[0.9rem] h-[0.9rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      name: "email",
      label: "Email",
      placeholder: "Email",
      type: "email",
      icon: (
        <svg className="w-[0.9rem] h-[0.9rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background decorative glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-16 -left-16 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--gold-primary)", opacity: 0.04 }}
        />
        <div
          className="absolute -bottom-24 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--gold-secondary)", opacity: 0.05 }}
        />
      </div>

      <div
        className={`relative max-w-7xl mx-auto transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - Info */}
          <div className="space-y-6">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border"
              style={{
                borderColor: "color-mix(in srgb, var(--gold-primary) 30%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--gold-primary) 8%, transparent)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--gold-primary)" }} />
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--gold-primary)" }}>
                Get In Touch
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Ready to deploy your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)]">
                AI Apps & Agents?
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 leading-relaxed">
              Questions about a specific agent or need a custom solution? We&apos;d love to help.
            </p>

            <div className="pt-2 space-y-4">
              {contactInfo.map((item) => (
                <div
                  key={item.title}
                  className="group relative flex items-start gap-4 rounded-2xl p-5 overflow-hidden transition-all duration-500 hover:-translate-y-1"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {/* Top edge gold line — appears on hover */}
                  <div
                    className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "linear-gradient(90deg, transparent, var(--gold-primary), transparent)" }}
                  />

                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white"
                    style={{
                      background: "linear-gradient(135deg, var(--gold-primary), color-mix(in srgb, var(--gold-primary) 60%, #000))",
                    }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{item.title}</h3>
                    <p className="text-gray-400 text-sm">{item.value}</p>
                  </div>
                  <span
                    className="text-3xl font-bold tabular-nums select-none leading-none"
                    style={{ color: "color-mix(in srgb, var(--gold-primary) 15%, transparent)" }}
                  >
                    {item.number}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Form */}
          <div
            className="relative w-full rounded-2xl p-6 sm:p-8 overflow-hidden"
            style={{
              backgroundColor: "rgba(26,26,26,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Glow accent */}
            <div
              className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full blur-3xl pointer-events-none"
              style={{ backgroundColor: "var(--gold-primary)", opacity: 0.06 }}
            />

            <div className="relative">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-5">
                Send us a message
              </h3>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Full Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-[0.78rem] font-medium text-gray-300 mb-1.5">
                        {field.label}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none z-10 text-gray-500">
                          {field.icon}
                        </div>
                        <input
                          type={field.type}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          className="w-full pl-9 pr-2.5 py-2.5 text-[0.78rem] bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] transition-all"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[0.78rem] font-medium text-gray-300 mb-1.5">
                    Subject
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none z-10">
                      <svg className="w-[0.9rem] h-[0.9rem] text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Message Subject"
                      className="w-full pl-9 pr-2.5 py-2.5 text-[0.78rem] bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[0.78rem] font-medium text-gray-300 mb-1.5">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Your message here..."
                    rows={4}
                    className="w-full px-3 py-2.5 text-[0.78rem] bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] transition-all resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
                <Button type="submit" disabled={isLoading} fullWidth>
                  {isLoading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
