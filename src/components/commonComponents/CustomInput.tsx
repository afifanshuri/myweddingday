type InputProps = React.ComponentProps<"input"> & {
  error?: boolean;
};

export default function CustomInput({
  className = "",
  error = false,
  ...props
}: InputProps) {
  return (
    <input
      className={`border-b ${error ? "border-red-500 focus:border-red-500" : "border-(--positive-secondary) focus:border-(--positive-tertiary)"} focus:outline-none focus:border-b-2 ${className}`}
      aria-invalid={error}
      {...props}
      min={props.type === "number" ? Math.max(0, Number(props.min ?? 0)) : props.min}
    ></input>
  );
}
