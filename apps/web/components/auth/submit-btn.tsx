import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";

type SubmitButtonProps = {
  isPending?: boolean;
  buttonText: string;
  disabled?: boolean;
  className?: string;
  onclick?: () => void;
};

const SubmitButton = ({
  isPending = false,
  buttonText,
  disabled,
  className,
  onclick,
}: SubmitButtonProps) => {
  return (
    <Button
      type="submit"
      disabled={disabled || isPending}
      className={cn(
        "flex w-full items-center justify-center rounded-lg h-10 active:scale-[0.98] transition-all duration-500 text-base text-background font-bold tracking-[0.015em] shadow-sm mt-2",
        className,
      )}
      onClick={onclick}
    >
      {isPending ? <Spinner /> : buttonText}
    </Button>
  );
};

export default SubmitButton;
