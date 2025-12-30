
import React, { useState, useEffect } from 'react';
import { VerificationStep, UserState } from '../types';
import { Icons } from './constants';
import Button from './components/Button';
import Input from './components/Input';
import OTPInput from './components/OTPInput';

const App: React.FC = () => {
  const [step, setStep] = useState<VerificationStep>(VerificationStep.LANDING);
  const [user, setUser] = useState<UserState>({ email: '', code: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(59);

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      setUser(prev => ({ ...prev, token }));
      setStep(VerificationStep.LINK_PROCESSING);

      setIsLoading(true);

      const queryParams = new URLSearchParams({
        token: token
      }).toString();

      fetch(`${API_BASE_URL}/api/user/confirm-email?${queryParams}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
        .then(async (res) => {
          if (res.ok) {
            setStep(VerificationStep.SUCCESS);
          } else {
            const errorText = await res.text();
            if (errorText.includes("expired")) {
              setStep(VerificationStep.EXPIRED);
            } else {
              setStep(VerificationStep.ERROR);
            }
          }
        })
        .catch(err => {
          console.error('Network error', err);
          setStep(VerificationStep.ERROR);
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (step === VerificationStep.ENTER_CODE && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.email) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(VerificationStep.ENTER_CODE);
      setTimer(59);
    }, 1200);
  };

  const handleVerify = (code?: string) => {
    const verificationCode = code || user.code;
    if (verificationCode.length !== 6) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(VerificationStep.SUCCESS);
    }, 1500);
  };

  const renderHeader = () => (
    <div className="flex flex-col items-center mb-8 lg:mb-12">
      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#2D241F] rounded-2xl flex items-center justify-center mb-6 border border-[#3D2F28] shadow-inner transform transition-transform hover:scale-105 duration-300">
        <Icons.Coffee />
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl lg:text-2xl font-bold tracking-tight text-white">Coffee</span>
        <span className="text-xl lg:text-2xl font-bold tracking-tight text-[#EAB308]">Peek</span>
      </div>
    </div>
  );

  // Landing Page (The "Plug")
  if (step === VerificationStep.LANDING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#1A1412] relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10 pointer-events-none" />
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#EAB308]/5 blur-[120px] rounded-full" />

        <div className="z-10 text-center max-w-3xl animate-in fade-in zoom-in-95 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2D241F] border border-[#3D2F28] text-[#EAB308] text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EAB308] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EAB308]"></span>
            </span>
            Beta access opening soon
          </div>

          <h1 className="text-5xl lg:text-8xl font-bold text-white mb-8 tracking-tighter leading-tight">
            The Art of Coffee, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EAB308] to-[#FACC15]">Perfected.</span>
          </h1>

          <p className="text-[#A39E93] text-lg lg:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Discover the world's finest beans, curated for your unique palate. Experience the next generation of specialty coffee subscription.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button className="sm:w-64 py-5 text-lg" onClick={() => setStep(VerificationStep.ENTER_EMAIL)}>
              Join the Waitlist
            </Button>
            <Button variant="secondary" className="sm:w-64 py-5 text-lg">
              Explore Collections
            </Button>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          {['Ethically Sourced', 'Expertly Roasted', 'Fast Shipping', 'Personalized'].map((feat) => (
            <div key={feat} className="text-[#A39E93] text-sm font-medium tracking-widest uppercase">{feat}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-8 bg-[#1A1412] relative overflow-hidden">
      <div className="absolute inset-0 bg-pattern opacity-20 pointer-events-none hidden lg:block" />
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#EAB308]/5 blur-[120px] rounded-full hidden lg:block" />

      <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto z-10">
        <div className="relative bg-[#1A1412]/80 backdrop-blur-xl border-0 lg:border lg:border-[#3D2F28] lg:rounded-[32px] lg:p-12 lg:shadow-2xl lg:shadow-black/50 transition-all duration-500">

          {(step !== VerificationStep.SUCCESS && step !== VerificationStep.LINK_PROCESSING) && (
            <button
              onClick={() => setStep(VerificationStep.LANDING)}
              className="absolute left-0 lg:left-8 top-0 lg:top-8 text-[#A39E93] hover:text-[#EAB308] p-2 transition-all hover:translate-x-[-4px]"
            >
              <Icons.Back />
            </button>
          )}

          <div className="pt-8 lg:pt-0">
            {step === VerificationStep.ENTER_EMAIL && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderHeader()}
                <div className="text-center mb-10">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">Join CoffeePeek</h1>
                  <p className="text-[#A39E93] lg:text-lg">Enter your email to join the exclusive waitlist.</p>
                </div>

                <form onSubmit={handleSendCode} className="space-y-6 lg:space-y-8">
                  <Input
                    label="Email address"
                    placeholder="name@example.com"
                    type="email"
                    required
                    autoFocus
                    value={user.email}
                    onChange={e => setUser({ ...user, email: e.target.value })}
                    icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>}
                  />
                  <Button type="submit" isLoading={isLoading} className="lg:py-5 lg:text-lg">
                    Request Access
                  </Button>
                </form>
              </div>
            )}

            {step === VerificationStep.ENTER_CODE && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center mb-10">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">Verify Identity</h1>
                  <p className="text-[#A39E93] lg:text-lg">A 6-digit code was sent to <span className="text-[#EAB308] font-semibold">{user.email}</span></p>
                </div>
                <div className="space-y-10">
                  <div className="flex flex-col items-center">
                    <OTPInput length={6} onComplete={handleVerify} />
                  </div>
                  <div className="space-y-4">
                    <Button onClick={() => handleVerify()} isLoading={isLoading} disabled={user.code.length < 6 && !isLoading} className="lg:py-5 lg:text-lg">
                      Confirm Code
                    </Button>
                    <div className="text-center pt-2">
                      {timer > 0 ? (
                        <p className="text-sm lg:text-base text-[#5C544F]">Resend in <span className="text-[#A39E93] font-medium">{timer}s</span></p>
                      ) : (
                        <button onClick={() => setTimer(59)} className="text-sm lg:text-base text-[#EAB308] font-medium hover:underline">Resend code</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === VerificationStep.LINK_PROCESSING && (
              <div className="text-center animate-in fade-in duration-500 py-12">
                <div className="w-16 h-16 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin mx-auto mb-8" />
                <h1 className="text-3xl font-bold text-white mb-3">Verifying Secure Link</h1>
                <p className="text-[#A39E93]">Please wait while we confirm your credentials...</p>
                <p className="text-[#5C544F] text-sm mt-4 font-mono truncate px-4">UID: {user.userId}</p>
              </div>
            )}

            {step === VerificationStep.SUCCESS && (
              <div className="text-center animate-in zoom-in-95 duration-700 pt-10 lg:pt-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 lg:w-32 lg:h-32 bg-[#EAB308]/10 rounded-full flex items-center justify-center mb-8 animate-bounce duration-[2000ms] border border-[#EAB308]/20 shadow-lg shadow-[#EAB308]/5">
                    <Icons.Check />
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">Verified!</h1>
                  <p className="text-[#A39E93] text-lg lg:text-xl max-w-[320px] mx-auto leading-relaxed">
                    Account confirmed. You're now on the priority list.
                  </p>
                  <div className="w-full mt-12">
                    <Button onClick={() => window.location.href = '/'} className="lg:py-5 lg:text-lg">
                      Enter Application
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
