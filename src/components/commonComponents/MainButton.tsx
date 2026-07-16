import { useRouter } from "next/navigation";
interface ButtonProps extends React.ComponentProps<"button"> {
  href?: string;
}
export default function MainButton({
  className = "",
  href,
  onClick,
  ...props
}: ButtonProps) {
  const router = useRouter();
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (onClick) onClick(e);
    if (href) router.push(href);
  }
  return (
    <button
      className={`bg-(--positive) rounded-2xl p-2 transition hover:cursor-pointer hover:scale-105 ${className}`}
      {...props}
      onClick={handleClick}
    ></button>
  );
}
