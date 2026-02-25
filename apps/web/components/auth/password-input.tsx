"use client";

import { Eye, EyeOff, Lock, LockOpen, RotateCcwKey } from "lucide-react";
import { Input } from "../ui/input";
import { ComponentProps, useState } from "react";

type Props = ComponentProps<typeof Input> & {
  showIcon?: boolean;
};

export const PasswordInput = ({
  className,
  showIcon = true,
  ...props
}: Props) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={`form-input w-full rounded-lg border border-[#dbe6df] bg-white h-10 px-4 pl-11 pr-11 text-base text-[#111813] placeholder-[#61896f] focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${className ?? ""}`}
      />

      {showIcon ? (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#61896f] pointer-events-none">
          {visible ? <LockOpen /> : <Lock />}
        </span>
      ) : (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#61896f] pointer-events-none">
          <RotateCcwKey />
        </span>
      )}

      {showIcon && (
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#61896f] hover:text-[#111813] transition-colors cursor-pointer"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
};
