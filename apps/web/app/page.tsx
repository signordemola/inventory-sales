import LoginForm from "@/components/auth/login-form";
import Logo from "@/components/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const HomePage = () => {
  return (
    <div className="flex flex-col grow justify-center items-center p-4 sm:p-6 lg:p-8 min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(#008550 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      <Card className="w-full max-w-lg mb-12">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="py-6">
            <Logo />
          </CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>

        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
