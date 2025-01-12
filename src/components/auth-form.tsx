// components/auth-form.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { berealClient } from "@/lib/bereal";

const phoneSchema = z.object({
  phone: z.string().min(10).max(15)
});

const otpSchema = z.object({
  code: z.string().length(6)
});

interface AuthFormProps {
  onAuthenticated: (token: string) => void;
}

export function AuthForm({ onAuthenticated }: AuthFormProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [sessionInfo, setSessionInfo] = useState<string>("");

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema)
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema)
  });

  async function onPhoneSubmit(data: z.infer<typeof phoneSchema>) {
    try {
      const info = await berealClient.requestCode(data.phone);
      setSessionInfo(info);
      setStep('otp');
    } catch (error) {
      console.error(error);
    }
  }

  async function onOtpSubmit(data: z.infer<typeof otpSchema>) {
    try {
      const token = await berealClient.verifyCode(sessionInfo, data.code);
      onAuthenticated(token);
    } catch (error) {
      console.error(error);
    }
  }

  if (step === 'phone') {
    return (
      <Form {...phoneForm}>
        <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4 w-full max-w-sm">
          <FormField
            control={phoneForm.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">Send Code</Button>
        </form>
      </Form>
    );
  }

  return (
    <Form {...otpForm}>
      <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4 w-full max-w-sm">
        <FormField
          control={otpForm.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <Input placeholder="123456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Verify Code</Button>
      </form>
    </Form>
  );
}
