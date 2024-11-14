type PropsType = {
  children: React.ReactNode
}

export default function Card({ children }: PropsType) {
  return (
    <div
      className='flex m-auto w-[600px] flex-col gap-y-4 shadow-lg rounded-lg bg-slate-100 p-8 text-center'
    >
      {children}
    </div>
  )
}
