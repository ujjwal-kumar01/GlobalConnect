// src/pages/VerifyEmailPage.jsx
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import meetingImage from '../../assets/business_meeting_office.jpg'; 

const VerifyEmailPage = () => {
  const [resendStatus, setResendStatus] = useState('');
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      otp: ['', '', '', '', '', ''] // Store the OTP as an array in RHF
    }
  });

  // 1. Handle Typing & Auto-Advance
  const handleOtpChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return; // Only allow numbers

    // Take only the last character in case of rapid typing
    const singleDigit = value.substring(value.length - 1); 
    
    // Update react-hook-form state manually
    setValue(`otp.${index}`, singleDigit, { shouldValidate: true });
    clearErrors('root'); // Clear any previous submission errors

    // Auto-advance to the next input
    if (singleDigit && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // 2. Handle Backspace (Auto-return to previous input)
  const handleKeyDown = (index, e) => {
    // If they hit backspace, the current box is empty, and it's not the first box
    if (e.key === 'Backspace' && !getValues(`otp.${index}`) && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // 3. Handle Pasting (e.g. "123456" from an email)
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    
    // Ensure all pasted characters are numbers
    if (pastedData.some(char => isNaN(char))) return; 

    // Update RHF state for each pasted character
    pastedData.forEach((char, i) => {
      setValue(`otp.${i}`, char, { shouldValidate: true });
    });
    
    // Focus the correct input after pasting
    const focusIndex = pastedData.length < 6 ? pastedData.length : 5;
    inputRefs.current[focusIndex].focus();
    clearErrors('root');
  };

  const onSubmit = async (data) => {
    const otpCode = data.otp.join(''); // Combine the array into a single string
    
    if (otpCode.length < 6) {
      setError('root', { message: 'Please enter the complete 6-digit code.' });
      return;
    }

    setResendStatus('');

    try {
      // API call to verify the OTP
      const response = await axios.post('/api/user/verify', {
        code: otpCode
      },
      {withCredentials: true}
    );
      
      console.log('Verification successful:', response.data);
      
      navigate('/onboarding', { replace: true });
      
    } catch (err) {
      setError('root', { 
        message: err.response?.data?.message || 'Invalid or expired verification code.' 
      });
    }
  };

  const handleResend = async () => {
    clearErrors('root');
    setResendStatus('Sending...');
    try {
      await axios.post('/api/user/resendVerificationCode',{}, {withCredentials:true});
      setResendStatus('A new code has been sent to your email.');
    } catch (err) {
      setError('root', { message: 'Failed to resend code. Please try again later.' });
      setResendStatus('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      
      <div className="w-full max-w-6xl bg-white rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200/60 relative">
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        {/* LEFT COLUMN: Branding */}
        <div className="flex w-full md:w-1/2 bg-slate-50 p-8 sm:p-10 lg:p-16 flex-col justify-center md:justify-between border-b md:border-b-0 md:border-r border-slate-200">
          <div className="flex items-center gap-3 mb-6 md:mb-12">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight relative z-10">Global Connect</span>
          </div>

          <div className="max-w-md space-y-3 md:space-y-4 mb-8 md:mb-10 relative z-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Secure your <span className="text-orange-500 font-extrabold">account</span> and join the network.
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              We take the security of our alumni network seriously. Verifying your email ensures that everyone on the platform is a genuine professional.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white relative z-10">
            <img src={meetingImage} alt="Network Security" className="w-full h-40 sm:h-48 md:h-64 lg:h-80 object-cover" />
          </div>
        </div>

        {/* RIGHT COLUMN: OTP Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-10 lg:p-16 flex flex-col justify-center bg-white relative z-10">
          
          <div className="mb-8 md:mb-10">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Check your email</h1>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              We've sent a 6-digit verification code to your email address. Enter it below to activate your account.
            </p>
          </div>

          {/* RHF Root Error Handling */}
          {errors.root && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center font-medium">
              {errors.root.message}
            </div>
          )}
          
          {resendStatus && !errors.root && (
            <div className="mb-6 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg border border-emerald-100 text-center font-medium">
              {resendStatus}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* OTP Input Boxes */}
            <div className="flex justify-between gap-2 sm:gap-4 max-w-sm">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  // Register the input, but we override onChange and value manually below
                  {...register(`otp.${index}`)}
                  onChange={(e) => handleOtpChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  ref={(el) => {
                    // This allows both RHF's ref and our custom array ref to work
                    register(`otp.${index}`).ref(el);
                    inputRefs.current[index] = el;
                  }}
                  className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-slate-50 rounded-xl border ${errors.root ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-transparent focus:ring-orange-500/20 focus:border-orange-500'} focus:bg-white focus:outline-none focus:ring-2 transition-all text-slate-900 shadow-sm`}
                />
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full max-w-sm bg-orange-500 text-white font-semibold py-3.5 rounded-xl hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Verifying...
                </>
              ) : 'Verify Email'}
            </button>
          </form>

          {/* Resend Link */}
          <div className="mt-8 text-center max-w-sm">
            <p className="text-sm text-slate-600">
              Didn't receive the code?{' '}
              <button 
                type="button" 
                onClick={handleResend}
                className="font-bold text-orange-600 hover:text-orange-700 hover:underline transition-all focus:outline-none"
              >
                Click to resend
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;