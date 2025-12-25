import HeroIllustration from "./components/illustrations/HeroIllustration";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";

export default function HomePage() {
  return (
    <main className="bg-gray-50">
      <Header/>
      {/* HERO */}
      <section className="bg-gradient-to-r from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 leading-tight">
              Help for daily life — shopping, travel, health & home
            </h1>
            <p className="text-gray-600 mt-4">
              Book trusted local helpers for errands, doctor visits, driving,
              shopping, and more.
            </p>

            <div className="flex gap-4 mt-6">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">
                Post a Task
              </button>
              <button className="px-6 py-3 border border-green-600 text-green-700 rounded-lg font-medium">
                Become a Helper
              </button>
            </div>

            <div className="mt-4">
              <select className="border rounded-lg px-4 py-2 w-64">
                <option>Select City or Pin Code</option>
                <option>Delhi</option>
                <option>Noida</option>
                <option>Bangalore</option>
              </select>
            </div>
          </div>

          {/* Illustration placeholder */}
          <div className="hidden md:block">
            <div className="w-full h-64 bg-blue-100 rounded-xl" />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-xl font-semibold mb-4">Browse Categories</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Cleaning",
            "Repairs",
            "Furniture Assembly",
            "Grocery Shopping",
          ].map((item) => (
            <CategoryCard key={item} title={item} />
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <ServiceBlock
          title="Shopping & Purchases"
          items={["Buy from Market", "Upload Prescription"]}
        />
        <ServiceBlock
          title="Travel & Driver Help"
          items={["Hire a Driver", "Travel Helper"]}
        />
        <ServiceBlock
          title="Health & Care Assistance"
          items={["Pickup & Drop", "Medical Errands"]}
        />
        <ServiceBlock
          title="Home Support"
          items={["Elder Care", "Daily Assistance"]}
        />
      </section>

      {/* TRUST */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-xl font-semibold mb-8">
            Safe & Reliable
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <TrustItem title="ID Checked" />
            <TrustItem title="Secure Payments" />
            <TrustItem title="Live Tracking" />
            <TrustItem title="24/7 Support" />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* <Testimonial
          text="Booked a helper for my father's doctor visit, wonderful experience!"
          author="Rahul, Noida"
        />
        <Testimonial
          text="Reliable service, got my grocery list purchased within 1 hour!"
          author="Priya, Bangalore"
        /> */}
        <HeroIllustration />
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-50 text-center">
        <button className="px-10 py-4 bg-green-700 text-white rounded-lg font-semibold text-lg">
          Start Earning
        </button>
      </section>

      {/* FOOTER */}
     <Footer/>
    </main>
  );
}

/* ---------- Reusable Components ---------- */

function CategoryCard({ title }) {
  return (
    <div className="bg-white border rounded-xl p-4 flex flex-col items-center justify-center hover:shadow-sm cursor-pointer">
      <div className="h-16 w-16 bg-gray-100 rounded-full mb-3" />
      <p className="font-medium">{title}</p>
    </div>
  );
}

function ServiceBlock({ title, items }) {
  return (
    <div>
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map((i) => (
          <div
            key={i}
            className="bg-white border rounded-xl p-4 text-center cursor-pointer hover:shadow-sm"
          >
            {i}
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustItem({ title }) {
  return (
    <div>
      <div className="h-14 w-14 mx-auto bg-gray-100 rounded-full mb-3" />
      <p className="font-medium">{title}</p>
    </div>
  );
}

function Testimonial({ text, author }) {
  return (
    <div className="bg-white border rounded-xl p-6">
      <p className="text-gray-700">“{text}”</p>
      <p className="mt-3 font-medium text-sm">— {author}</p>
    </div>
  );
}
