import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { 
  Globe2, 
  ShieldCheck, 
  Truck, 
  Boxes, 
  FileCheck, 
  Factory, 
  ArrowRight,
  Handshake
} from 'lucide-react'

export default function ServicesPage() {
  const services = [
    {
      icon: Globe2,
      title: 'Global Import & Export Logistics',
      description: 'Full-container load (FCL), less-than-container load (LCL), and vessel chartering across key trade routes connecting India, Asia, Middle East, Africa, and Europe.',
    },
    {
      icon: ShieldCheck,
      title: 'Quality Inspection & COA Verification',
      description: 'Every consignment undergoes laboratory testing. We provide certified Certificates of Analysis (COA) and SGS/Intertek third-party audit reports.',
    },
    {
      icon: Factory,
      title: 'Custom Contract Manufacturing & Sourcing',
      description: 'Tailored chemical formulation grading, mineral mesh pulverization, and customized agricultural grading according to client industrial requirements.',
    },
    {
      icon: Boxes,
      title: 'Bulk Industrial Packaging Solutions',
      description: 'High-density polypropylene (HDPE) jumbo bags, multi-wall paper sacks, liquid ISO tank containers, and customized corporate brand packaging.',
    },
    {
      icon: FileCheck,
      title: 'Customs Clearance & Regulatory Compliance',
      description: 'End-to-end documentation management including Bill of Lading, Phytosanitary certificates, Certificate of Origin, and export customs clearance.',
    },
    {
      icon: Truck,
      title: 'Port Warehousing & Supply Chain Management',
      description: 'Strategic warehousing near Mundra, Kandla, and JNPT ports for quick dispatch, inventory buffer holding, and minimal transit latency.',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-amber-100 selection:text-amber-900">
      <Navbar />

      {/* Header Banner */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <Handshake className="w-3.5 h-3.5 text-amber-700" />
            <span>End-to-End Impex Solutions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Trading Services & Global Capabilities
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl mx-auto">
            Providing seamless international commodity trade, custom raw material processing, and dependable supply chain management.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((srv, idx) => {
            const Icon = srv.icon
            return (
              <div key={idx} className="glass-card p-8 space-y-5 flex flex-col justify-between group bg-white border-slate-200">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                    {srv.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {srv.description}
                  </p>
                </div>
                <Link
                  href="/inquire"
                  className="text-xs font-bold text-amber-700 inline-flex items-center gap-1 pt-2 group-hover:translate-x-1 transition-transform"
                >
                  <span>Request Custom Contract</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* Process Walkthrough */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Our Trade Workflow</span>
            <h2 className="text-3xl font-extrabold text-slate-900">How We Fulfill Commodity Orders</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-extrabold flex items-center justify-center mx-auto text-sm shadow-xs">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-base">RFQ & Spec Submission</h4>
              <p className="text-xs text-slate-600">Client submits required material specs, quantity, and port destination.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-extrabold flex items-center justify-center mx-auto text-sm shadow-xs">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-base">Quotation & Sample Audit</h4>
              <p className="text-xs text-slate-600">We issue proforma invoice & dispatch batch test samples for verification.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-extrabold flex items-center justify-center mx-auto text-sm shadow-xs">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-base">Production & Inspection</h4>
              <p className="text-xs text-slate-600">Material is processed, packaged, and inspected by independent auditors.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-extrabold flex items-center justify-center mx-auto text-sm shadow-xs">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-base">Dispatch & Port Tracking</h4>
              <p className="text-xs text-slate-600">Container loaded, shipping documents issued, and live tracking updated.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
