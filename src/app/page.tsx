import MainButton from "@/components/commonComponents/MainButton";

export default async function Home() {
  return (
    <div
      id="mainContainer"
      className="flex flex-col w-3/4 xl:w-1/2 justify-center items-center mx-auto h-screen text-center"
    >
      <p className="libre-font text-[30px] xl:text-[60px] leading-10 xl:leading-14 mb-14 font-bold">
        Planning a wedding have never been easier, until now
      </p>
      <p className="text-[20px] w-3/4 leading-7 mb-8">
        Describe your wedding. Choose freely from over 10,000+ wedding vendors,
        tailored exactly to your liking
      </p>
      <div className="mb-2">
        <MainButton label="Start Planning" path="/weddingplan"></MainButton>
      </div>
      <p className="opacity-50">6 Categories - Takes about 5 minutes</p>
    </div>
  );
}
