import { Link } from "react-router-dom";
import { Zap, MapPin, Star, Shield, Clock, CheckCircle, ArrowRight, Wrench, Zap as ZapIcon, Leaf, Hammer } from "lucide-react";

const FEATURES = [
  {
    icon: <MapPin className="w-6 h-6 text-blue-600" />,
    title: "Location-based matching",
    desc: "Find service providers within your chosen radius using GPS. No more calling strangers or relying on word of mouth.",
  },
  {
    icon: <Star className="w-6 h-6 text-amber-500" />,
    title: "Ratings & reviews",
    desc: "Every provider is rated by real customers. Make informed decisions based on verified feedback.",
  },
  {
    icon: <Shield className="w-6 h-6 text-emerald-500" />,
    title: "Safe & secure",
    desc: "JWT-authenticated sessions, secure payment tracking, and encrypted data at every layer.",
  },
  {
    icon: <Clock className="w-6 h-6 text-purple-500" />,
    title: "Quick turnaround",
    desc: "Post a job and get competitive bids from local providers within minutes — not days.",
  },
];

const CATEGORIES = [
  { icon: <Wrench className="w-5 h-5" />, label: "Plumber", color: "bg-blue-100 text-blue-700" },
  { icon: <ZapIcon className="w-5 h-5" />, label: "Electrician", color: "bg-amber-100 text-amber-700" },
  { icon: <Leaf className="w-5 h-5" />, label: "Gardener", color: "bg-emerald-100 text-emerald-700" },
  { icon: <Hammer className="w-5 h-5" />, label: "Carpenter", color: "bg-orange-100 text-orange-700" },
];

const STEPS = [
  { step: "1", title: "Post your job", desc: "Describe what you need and pin the location on the map." },
  { step: "2", title: "Receive bids", desc: "Local service providers submit competitive proposals with their prices." },
  { step: "3", title: "Pick a provider", desc: "Compare bids, check reviews, and accept the best offer." },
  { step: "4", title: "Job done & pay", desc: "Mark the job complete and payment is recorded automatically." },
];

export default function LandingPage() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="text-center space-y-6 py-12">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full border border-blue-200">
          <Zap className="w-4 h-4" /> Now deploying on AWS
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
          Local services,<br />
          <span className="text-blue-600">on demand.</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          ServiQuick connects people who need household services with trusted local providers — instantly, affordably, and near you.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm"
          >
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Category pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
          {CATEGORIES.map(c => (
            <span key={c.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${c.color}`}>
              {c.icon} {c.label}
            </span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { value: "500+", label: "Providers" },
          { value: "2 min", label: "Avg. response time" },
          { value: "4.8★", label: "Avg. rating" },
          { value: "100%", label: "Secure payments" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
            <div className="text-2xl font-extrabold text-blue-600">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">How it works</h2>
          <p className="text-gray-500">Four simple steps from problem to solution.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map(s => (
            <div key={s.step} className="relative bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mb-3">
                {s.step}
              </div>
              <h3 className="font-semibold text-gray-900">{s.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Why ServiQuick?</h2>
          <p className="text-gray-500">Built for speed, trust, and simplicity.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white space-y-4">
        <h2 className="text-2xl font-bold">Ready to get started?</h2>
        <p className="text-blue-100">Join thousands of happy customers and skilled providers.</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl text-sm hover:bg-blue-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" /> Create free account
          </Link>
          <Link
            to="/providers"
            className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors"
          >
            Browse providers
          </Link>
        </div>
      </section>
    </div>
  );
}
