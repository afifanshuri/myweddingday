type TextareaProps = React.ComponentProps<"textarea">;
export default function CustomTextarea({
  className = "",
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={`resize-none border rounded-lg border-(--positive) bg-white focus:border-(--positive-secondary) active:border-(--positive) focus:outline-none focus:border-2 ${className}`}
      {...props}
    ></textarea>
  );
}
