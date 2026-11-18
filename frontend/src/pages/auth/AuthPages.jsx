import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { forgotPasswordFormSchema, loginFormSchema, resetPasswordFormSchema } from '@/schemas/forms';
import { Button } from '@/components/ui/Button';
import { FormField, Input, PasswordInput } from '@/components/ui/FormControls';

export function LoginPage() {
  const { login, getHomePath } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const data = await login(values);
      toast.success(`Welcome back, ${data.employee?.firstName || data.user.email}`);
      navigate(getHomePath(data.user.role), { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Invalid email or password'));
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[18px] font-semibold text-[#202124]">Sign in to WorkTrack</h1>
        <p className="mt-1 text-[13px] text-[#747B87]">Enter your work credentials to continue.</p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-[8px] border border-[#F5CFCB] bg-[#FDEEEC] px-3 py-2 text-[12px] text-[#C0392B]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Work Email" htmlFor="email" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            {...register('email')}
            error={errors.email}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password}
          />
        </FormField>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-[12px] font-medium text-[#3867D6] hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordFormSchema),
  });

  const onSubmit = async (values) => {
    try {
      await authApi.forgotPassword(values);
      setSubmitted(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[#1E7E5A]">
          <CheckCircle2 className="h-5 w-5" />
          <h1 className="text-[16px] font-semibold text-[#202124]">Check your email</h1>
        </div>
        <p className="text-[13px] text-[#747B87]">
          If an account exists for that email address, we have sent a password reset link valid for 15 minutes.
        </p>
        <Link to="/login" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3867D6] hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[18px] font-semibold text-[#202124]">Reset your password</h1>
        <p className="mt-1 text-[13px] text-[#747B87]">
          Enter your work email and we will send you instructions to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Work Email" required error={errors.email?.message}>
          <Input type="email" placeholder="name@company.com" {...register('email')} error={errors.email} />
        </FormField>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link to="/login" className="inline-flex items-center gap-1 text-[12px] text-[#747B87] hover:text-[#202124]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordFormSchema),
  });

  const onSubmit = async (values) => {
    try {
      await authApi.resetPassword({ token, password: values.password });
      toast.success('Password reset successfully. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[18px] font-semibold text-[#202124]">Create new password</h1>
        <p className="mt-1 text-[13px] text-[#747B87]">Choose a strong password with at least 8 characters.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="New Password" required error={errors.password?.message}>
          <PasswordInput autoComplete="new-password" placeholder="Min 8 characters" {...register('password')} error={errors.password} />
        </FormField>
        <FormField label="Confirm New Password" required error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" placeholder="Re-enter new password" {...register('confirmPassword')} error={errors.confirmPassword} />
        </FormField>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </div>
  );
}
