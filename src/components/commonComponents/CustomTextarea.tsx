type TextareaProps = React.ComponentProps<"textarea">;
export default function CustomTextarea({
  className = "",
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={`resize-none border rounded-lg border-gray-400 focus:border-gray-800 ${className}`}
      {...props}
    ></textarea>
  );
}
