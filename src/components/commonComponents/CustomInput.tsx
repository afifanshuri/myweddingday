type InputProps = React.ComponentProps<"input">;
export default function CustomInput({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`border-b border-gray-300 focus:outline-none focus:border-gray-800 focus:border-b-2 ${className}`}
      {...props}
    ></input>
  );
}
