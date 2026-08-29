import { Laptop2, Moon, SunMedium } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { useTheme } from "../../context/ThemeContext";

const options = [
  { id: "light", label: "Light", icon: SunMedium },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Laptop2 },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const activeOption =
    options.find((option) => option.id === theme) ?? options[2];
  const ActiveIcon = activeOption.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="group bg-transparent border-none shadow-none hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Select theme"
        >
          <motion.span
            key={activeOption.id}
            initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "backOut" }}
            className="flex items-center justify-center"
          >
            {theme === "dark" ? (
              <SunMedium className="h-4 w-4 text-primary transition-transform duration-200 group-hover:scale-110" />
            ) : (
              <Moon className="h-4 w-4 text-primary transition-transform duration-200 group-hover:scale-110" />
            )}
          </motion.span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 rounded-2xl border-border/60 bg-background/95 p-1.5 shadow-2xl backdrop-blur-xl"
      >
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = option.id === theme;

          return (
            <DropdownMenuItem
              key={option.id}
              onClick={() => setTheme(option.id)}
              className="rounded-xl px-3 py-2.5"
            >
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-foreground/70" />
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
                <span
                  className={
                    isActive
                      ? "h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_18px_rgba(59,130,246,0.35)]"
                      : "h-2.5 w-2.5 rounded-full border border-border/80"
                  }
                />
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
