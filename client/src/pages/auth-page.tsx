import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, authSchema, LoginData } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Auth forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <Tabs 
          defaultValue={activeTab} 
          className="w-full max-w-md" 
          onValueChange={(value) => setActiveTab(value as "login" | "register")}
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm isLoading={loginMutation.isPending} onSubmit={loginMutation.mutate} />
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2">
                <div className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Button variant="link" className="p-0" onClick={() => setActiveTab("register")}>
                    Create one now
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                  Register to save and manage your moving estimates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RegisterForm isLoading={registerMutation.isPending} onSubmit={registerMutation.mutate} />
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2">
                <div className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Button variant="link" className="p-0" onClick={() => setActiveTab("login")}>
                    Login instead
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Right side - Hero content */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-r from-purple-500 to-indigo-600 items-center justify-center p-12 text-white">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-4">MoveEase Calculator</h1>
          <p className="text-xl mb-8">
            Save your moving estimates, track your upcoming moves, and get access to exclusive discounts from our partner moving companies.
          </p>
          <div className="space-y-4">
            <FeatureItem title="Save Multiple Estimates">
              Compare different moving scenarios side-by-side
            </FeatureItem>
            <FeatureItem title="Track Moving Timeline">
              Get reminders as your moving date approaches
            </FeatureItem>
            <FeatureItem title="Access Member Discounts">
              Exclusive deals from partner moving companies
            </FeatureItem>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 p-1">
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-white/80">{children}</p>
      </div>
    </div>
  );
}

function LoginForm({ isLoading, onSubmit }: { isLoading: boolean, onSubmit: (data: LoginData) => void }) {
  const form = useForm<LoginData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm({ isLoading, onSubmit }: { isLoading: boolean, onSubmit: (data: LoginData) => void }) {
  const form = useForm<LoginData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Choose a username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Create a password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </Form>
  );
}