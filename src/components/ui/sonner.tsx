import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg font-caslon-regular text-elegant",
          description: "group-[.toast]:text-muted-foreground font-caslon-regular text-elegant",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-caslon-medium btn-elegant",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-caslon-regular btn-elegant",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
