import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";

export default function HowItWorksPage() {
  const steps = [
    {
      title: "Post a Task",
      desc: "Describe what you need and set your budget.",
    },
    {
      title: "Get Matched",
      desc: "Trusted local helpers apply for your task.",
    },
    {
      title: "Get It Done",
      desc: "Choose a helper and get your task completed.",
    },
  ];

  return (
    <>
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-center mb-12">
          How HireBuddy Works
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl shadow-sm text-center"
            >
              <div className="h-12 w-12 mx-auto rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold mb-4">
                {i + 1}
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
