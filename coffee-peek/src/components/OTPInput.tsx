
import React, { useRef, useState, useEffect } from 'react';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
}

const OTPInput: React.FC<OTPInputProps> = ({ length = 6, onComplete }) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value.substring(element.value.length - 1);
    setOtp(newOtp);

    // Focus next input
    if (element.value && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (newOtp.every(val => val !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').slice(0, length).split('');
    if (data.every(char => !isNaN(Number(char)))) {
      const newOtp = [...otp];
      data.forEach((char, i) => {
        if (i < length) newOtp[i] = char;
      });
      setOtp(newOtp);
      if (data.length === length) onComplete(data.join(''));
      const lastIndex = Math.min(data.length, length - 1);
      inputs.current[lastIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2 sm:gap-4 lg:gap-5">
      {otp.map((data, index) => (
        <input
          key={index}
          ref={el => (inputs.current[index] = el)}
          type="text"
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          value={data}
          onChange={e => handleChange(e.target, index)}
          onKeyDown={e => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="
            w-11 h-14 sm:w-14 sm:h-16 lg:w-16 lg:h-20
            text-center text-2xl lg:text-3xl font-bold 
            bg-[#2D241F] border border-[#3D2F28] rounded-xl lg:rounded-2xl 
            text-[#EAB308] focus:border-[#EAB308] focus:ring-1 focus:ring-[#EAB308] 
            outline-none transition-all duration-200
            hover:border-[#4D3D33]
          "
        />
      ))}
    </div>
  );
};

export default OTPInput;
