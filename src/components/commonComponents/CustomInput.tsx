type InputProps = React.ComponentProps<"input">;
export default function CustomInput({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`border-b border-(--positive-secondary) focus:outline-none focus:border-(--positive-tertiary) focus:border-b-2 ${className}`}
      {...props}
    ></input>
  );
}
