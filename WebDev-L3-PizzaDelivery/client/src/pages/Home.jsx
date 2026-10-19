import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Flame,
  Clock,
  ShieldCheck,
  Truck,
  Award,
  ChevronRight,
  Star,
  CheckCircle2,
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import PizzaCard from '../components/pizza/PizzaCard';
import PizzaDetailModal from '../components/pizza/PizzaDetailModal';
import { FEATURED_PIZZAS } from '../data/pizzas';

export const Home = () => {
  const navigate = useNavigate();
  const [selectedPizza, setSelectedPizza] = useState(null);

  const steps = [
    {
      number: '01',
      title: '48H Cold Fermented Sourdough',
      desc: 'Crafted with unbleached organic Italian flour, wild sourdough starter, and a slow two-day maturation for an airy, easily digestible cornicione.',
      icon: Clock,
    },
    {
      number: '02',
      title: 'DOP Artisanal Ingredients',
      desc: 'San Marzano tomatoes grown in volcanic soil of Mount Vesuvius, fresh buffalo mozzarella from Campania, and cold-pressed Ligurian olive oil.',
      icon: Award,
    },
    {
      number: '03',
      title: 'Blistering 485°C Wood-Fired Bake',
      desc: 'Flash-cooked in 90 seconds inside bespoke oak-fired domed ovens to lock in vibrant moisture and deliver signature leopard-spotted char.',
      icon: Flame,
    },
    {
      number: '04',
      title: 'Heated Micro-Vent Delivery',
      desc: 'Packaged in breathable, bio-degradable thermal containers engineered to prevent crust sogginess and guarantee piping hot delivery.',
      icon: Truck,
    },
  ];

  const benefits = [
    {
      title: 'Farm-To-Crust Provenance',
      desc: 'Every single component is traceable back to small-batch organic farms and DOP certified Italian consortiums.',
      icon: ShieldCheck,
      color: '#00804C',
    },
    {
      title: 'Superior Digestibility',
      desc: 'Our prolonged sourdough fermentation dismantles complex starches so you never feel heavy or bloated afterwards.',
      icon: Sparkles,
      color: '#DBE64C',
    },
    {
      title: 'Precision Temperature Control',
      desc: 'Specialized thermal transport bags maintain optimal eating temperature from our stone oven to your front door.',
      icon: Flame,
      color: '#1E488F',
    },
    {
      title: '100% Sustainable Packaging',
      desc: 'Zero single-use plastics. Recycled unbleached cardboard with natural vegetable oil-based inks.',
      icon: CheckCircle2,
      color: '#74C365',
    },
  ];

  return (
    <div className="space-y-20 sm:space-y-28 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#001F3F] text-[#F6F7ED] pt-12 pb-24 sm:pt-20 sm:pb-32">
        {/* Subtle decorative radial glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00804C]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#DBE64C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Hero Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-4 py-1.5 rounded-full backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-[#DBE64C] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#DBE64C]">
                  Artisanal Wood-Fired Pizzeria
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-display leading-[1.08]">
                Mastercrafted Pizzas. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DBE64C] via-[#74C365] to-white">
                  Fermented For Perfection.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Hand-stretched 48-hour cold fermented sourdough, sweet volcanic San Marzano tomatoes, and creamy Fior di Latte baked at 485°C. Delivered steaming hot to your doorstep.
              </p>

              {/* Main CTAs */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button
                  variant="accent"
                  size="lg"
                  onClick={() => navigate('/builder')}
                  icon={Sparkles}
                  className="w-full sm:w-auto shadow-lg hover:shadow-[#DBE64C]/25"
                >
                  Build Your Pizza
                </Button>

                <Button
                  variant="outlineWhite"
                  size="lg"
                  onClick={() => navigate('/menu')}
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full sm:w-auto"
                >
                  Explore Menu
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
                <div>
                  <div className="text-2xl font-black text-[#DBE64C]">4.95 ★</div>
                  <div className="text-xs text-slate-400 font-medium">Over 2,400 Reviews</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">48h</div>
                  <div className="text-xs text-slate-400 font-medium">Slow Sourdough</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#74C365]">485°C</div>
                  <div className="text-xs text-slate-400 font-medium">Volcanic Oak Bake</div>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Food Photography */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Hero pizza circular badge */}
                <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/15 bg-white/5">
                  <img
                    src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=85"
                    alt="Authentic Artisanal Neapolitan Wood-Fired Pizza"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Floating highlight card 1 */}
                <div className="absolute -bottom-6 -left-6 bg-white text-[#001F3F] p-4 rounded-2xl shadow-xl border border-slate-100 hidden sm:flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00804C] text-[#DBE64C] flex items-center justify-center font-bold">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-[#00804C]">Fresh Out Of Oven</span>
                    <span className="text-sm font-extrabold">90-Sec Oak Fire Bake</span>
                  </div>
                </div>

                {/* Floating highlight card 2 */}
                <div className="absolute -top-6 -right-6 bg-[#001F3F]/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-white/15 hidden sm:flex items-center gap-2.5">
                  <Star className="w-4 h-4 fill-[#DBE64C] text-[#DBE64C]" />
                  <span className="text-xs font-bold">Campania DOP Mozzarella</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURED PIZZAS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#00804C] mb-2">
              <Sparkles className="w-4 h-4" /> Chef's Signature Selection
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#001F3F] tracking-tight">
              Featured Artisanal Pies
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-xl">
              Each pizza is individually hand-shaped to order, crowned with premium Italian goods, and baked over seasoned aromatic hardwood.
            </p>
          </div>

          <div className="mt-6 md:mt-0">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/menu')}
              icon={ArrowRight}
              iconPosition="right"
            >
              View Full Menu ({FEATURED_PIZZAS.length} Pizzas)
            </Button>
          </div>
        </div>

        {/* Pizza Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURED_PIZZAS.slice(0, 3).map((pizza) => (
            <PizzaCard
              key={pizza.id}
              pizza={pizza}
              onSelect={(p) => setSelectedPizza(p)}
            />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="bg-white py-20 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="mantis" size="sm" className="mb-3">
              The Method
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-[#001F3F] tracking-tight">
              How PizzaVerse Crafts Perfection
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              We never cut corners. Our sacred four-step culinary philosophy blends ancient Neapolitan heritage with modern precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#F6F7ED] p-7 rounded-3xl border border-slate-200/70 relative flex flex-col justify-between hover:border-[#00804C]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-[#001F3F] text-[#DBE64C] flex items-center justify-center shadow-md">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-3xl font-black text-slate-300 font-display">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#001F3F] mb-2 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {step.desc}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-semibold text-[#00804C]">
                    <span>Standardized Craft</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BENEFITS / VALUES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <Badge variant="bookGreen" size="sm">
              Connoisseur Standards
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-[#001F3F] tracking-tight leading-tight">
              Why Discerning Foodies Choose PizzaVerse
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Commercial pizza chains rely on bleached dough and frozen cheese blocks. We built PizzaVerse around zero compromises: organic flour, raw milk cheeses, and live fermentation.
            </p>
            <div className="pt-2">
              <Button
                variant="midnight"
                size="md"
                onClick={() => navigate('/menu')}
                icon={ChevronRight}
                iconPosition="right"
              >
                Browse Menu Offerings
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs card-hover-lift"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white"
                    style={{ backgroundColor: b.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#001F3F] mb-2">
                    {b.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#001F3F] rounded-3xl p-8 sm:p-14 text-[#F6F7ED] relative overflow-hidden shadow-2xl border border-white/10 text-center sm:text-left">
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#DBE64C] block mb-2">
              Join Our Culinary Community
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Unlock Exclusive Tasting Menus & Custom Pizza Crafting
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mb-8 leading-relaxed">
              Create your complimentary PizzaVerse account today to save custom flavor profiles, unlock secret chef specials, and enjoy flash delivery.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center sm:justify-start">
              <Button
                variant="accent"
                size="lg"
                onClick={() => navigate('/register')}
                icon={Sparkles}
              >
                Create Free Account
              </Button>
              <Button
                variant="outlineWhite"
                size="lg"
                onClick={() => navigate('/menu')}
              >
                Explore Full Menu
              </Button>
            </div>
          </div>

          {/* Decorative background element */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-[#00804C]/25 blur-2xl pointer-events-none" />
        </div>
      </section>

      {/* Pizza detail modal if opened */}
      {selectedPizza && (
        <PizzaDetailModal
          pizza={selectedPizza}
          onClose={() => setSelectedPizza(null)}
        />
      )}

    </div>
  );
};

export default Home;
