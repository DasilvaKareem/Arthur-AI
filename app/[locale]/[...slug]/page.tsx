import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Logo } from "../../../components/ui/logo";
import { Check, X } from "lucide-react";
import Image from "next/image";
import { getTranslation } from "../../lib/getTranslation";
import { locales, type Locale } from "../../locales";
import LocalizedNav from "./LocalizedNav";
import { FAQ } from "../../../registry/magicui/faq";

type Params = {
  locale: string;
  slug?: string[];
};

interface PageProps {
  params: Params;
}

// Generate link URLs on the server side
function createLocalizedLink(locale: string, path: string) {
  return `/${locale}${path ? '/' + path : ''}`;
}

export default async function LocalizedPage({ params }: PageProps) {
  const { locale, slug = [] } = params;

  if (!locales.includes(locale as Locale)) {
    notFound(); // Invalid locale
  }

  // Get translations
  const t = await getTranslation(locale as Locale);
  const path = slug.join('/') || 'home';

  // Generate all the links we need server-side
  const links = {
    home: createLocalizedLink(locale, ""),
    features: createLocalizedLink(locale, "features"),
    pricing: createLocalizedLink(locale, "pricing"),
    signin: "/auth/signin",
    signup: "/auth/signup",
    terms: createLocalizedLink(locale, "terms"),
    privacy: createLocalizedLink(locale, "privacy"),
  };

  // Features constant for the features page
  const features = [
    {
      title: t.features.featuresList.textToScript.title,
      subtitle: t.features.featuresList.textToScript.subtitle,
      description: t.features.featuresList.textToScript.description,
      gifPlaceholder: "/box33.gif"
    },
    {
      title: t.features.featuresList.scriptToStoryboard.title,
      subtitle: t.features.featuresList.scriptToStoryboard.subtitle,
      description: t.features.featuresList.scriptToStoryboard.description,
      gifPlaceholder: "/box2.gif"
    },
    {
      title: t.features.featuresList.storyboardToAnimation.title,
      subtitle: t.features.featuresList.storyboardToAnimation.subtitle,
      description: t.features.featuresList.storyboardToAnimation.description,
      gifPlaceholder: "/box3.gif"
    }
  ];

  // Pricing plans for pricing page
  const plans = [
    {
      name: t.pricing.plans.free.name,
      description: t.pricing.plans.free.description,
      price: t.pricing.plans.free.price,
      features: [
        { name: `3 ${t.pricing.features.storiesPerMonth}`, included: true },
        { name: `${t.pricing.features.videoGenerations}`, label: "Limited (3 per month)", included: true },
        { name: `${t.pricing.features.imageGenerations}`, label: "Limited (no custom scenes)", included: true },
        { name: t.pricing.features.scriptEditorAccess, included: true },
        { name: t.pricing.features.support, included: true },
        { name: t.pricing.features.dialogue, included: false },
        { name: t.pricing.features.narration, included: false },
        { name: t.pricing.features.soundEffects, included: false },
        { name: t.pricing.features.lipSync, included: false },
        { name: t.pricing.features.storyboardExport, included: false },
        { name: t.pricing.features.projectPrivacy, included: false },
      ],
      cta: {
        text: t.pricing.plans.free.cta,
        href: links.signup,
      },
    },
    {
      name: t.pricing.plans.creator.name,
      description: t.pricing.plans.creator.description,
      price: t.pricing.plans.creator.price,
      features: [
        { name: `30 ${t.pricing.features.storiesPerMonth}`, included: true },
        { name: `${t.pricing.features.videoGenerations}`, label: "60/month", included: true },
        { name: `${t.pricing.features.imageGenerations}`, label: "Full Access", included: true },
        { name: t.pricing.features.scriptEditorAccess, included: true },
        { name: "Email support", included: true },
        { name: t.pricing.features.dialogue, included: true },
        { name: t.pricing.features.narration, included: true },
        { name: t.pricing.features.soundEffects, included: true },
        { name: t.pricing.features.lipSync, included: true },
        { name: t.pricing.features.storyboardExport, included: true },
        { name: t.pricing.features.projectPrivacy, included: true },
      ],
      cta: {
        text: t.pricing.plans.creator.cta,
        href: links.signup,
      },
      highlight: true,
      mostPopular: t.pricing.plans.creator.mostPopular,
    },
    {
      name: t.pricing.plans.pro.name,
      description: t.pricing.plans.pro.description,
      price: t.pricing.plans.pro.price,
      features: [
        { name: `${t.pricing.features.storiesPerMonth}`, label: "Unlimited", included: true },
        { name: `${t.pricing.features.videoGenerations}`, label: "Unlimited", included: true },
        { name: `${t.pricing.features.imageGenerations}`, label: "Unlimited", included: true },
        { name: t.pricing.features.scriptEditorAccess, included: true },
        { name: "Direct line to team", included: true },
        { name: `${t.pricing.features.dialogue} + Premium voices`, included: true },
        { name: t.pricing.features.narration, included: true },
        { name: t.pricing.features.soundEffects, included: true },
        { name: `${t.pricing.features.lipSync} + Emotion Sync`, included: true },
        { name: `${t.pricing.features.storyboardExport} + High-Res PDF`, included: true },
        { name: t.pricing.features.projectPrivacy, included: true },
      ],
      cta: {
        text: t.pricing.plans.pro.cta,
        href: links.signup,
      },
    },
  ];

  // Navigation props to pass to the component
  const navProps = {
    locale: locale as Locale,
    path,
    translations: t,
    links: links,
  };

  return (
    <div className="relative flex-col min-h-screen">
      <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none bg-gradient-to-b from-[#e0e8ff] via-[#f5f7ff] to-white dark:bg-gradient-to-b dark:from-[#5f7fc5] dark:via-[#0a0e2a] dark:to-[#0a0e2a]" />
      <LocalizedNav {...navProps} />

      {/* Home Page */}
      {path === 'home' && (
        <>
          {/* Hero Section */}
          <section className="relative pt-32 md:pt-40 pb-20">
            <div className="container">
              <div className="mx-auto max-w-[58rem] text-center">
                <div className="flex justify-center mb-8">
                  <Logo className="w-24 h-24 animate-float" />
                </div>
                <h1 className="font-bold tracking-tight text-4xl sm:text-6xl md:text-7xl lg:text-8xl">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600">
                    {t.home.hero.title}
                  </span>
                </h1>
                <p className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                  {t.home.hero.subtitle}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Link href="#request-access">
                    <Button size="lg" className="text-base">
                      {t.common.requestAccess}
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="text-base">
                    {t.common.watchDemo}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Video Dialog Section */}
          <section className="relative container flex justify-center items-center py-12">
            <div className="w-full max-w-4xl">
              {/* LocalizedHeroVideo removed */}
            </div>
          </section>

          {/* Request Access Section */}
          <section id="request-access" className="relative z-10 container py-12 text-center">
            <div className="mx-auto max-w-4xl rounded-lg border dark:border-gray-700 border-gray-300 dark:bg-gray-800/50 bg-white/80 p-8 backdrop-blur-sm">
              <h2 className="text-3xl font-bold mb-4 dark:text-white text-gray-900">{t.home.requestAccess.title}</h2>
              <p className="dark:text-gray-300 text-gray-700 mb-6">
                {t.home.requestAccess.description}
              </p>
              <form className="flex flex-col gap-4 items-center">
                <div className="w-full max-w-md">
                  <label htmlFor="EMAIL" className="text-left font-medium dark:text-gray-300 text-gray-700">
                    {t.home.requestAccess.accessLabel}
                  </label>
                  <input
                    type="email"
                    name="EMAIL"
                    id="EMAIL"
                    placeholder={t.home.requestAccess.email}
                    required
                    className="w-full rounded dark:border-gray-700 border-gray-300 dark:bg-gray-900/50 bg-white/80 px-4 py-2 text-sm dark:text-white text-gray-900 placeholder:dark:text-gray-400 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 rounded w-[200px] bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-700"
                >
                  {t.common.requestAccess}
                </button>
              </form>
            </div>
          </section>

          {/* Turn Your Stories Into Animation Section */}
          <section className="relative py-24 z-10">
            <div className="container">
              <div className="mx-auto mb-12 max-w-[58rem] text-center">
                <h2 className="font-bold text-3xl leading-tight sm:text-4xl md:text-5xl dark:text-white text-gray-900">
                  {t.home.storiesSection.title}
                </h2>
                <p className="mt-4 text-muted-foreground sm:text-lg">
                  {t.home.storiesSection.subtitle}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
                {t.home.storiesSection.cards.map((card: { title: string; description: string }, index: number) => (
                  <div key={index} className="p-8 rounded-lg border dark:border-gray-700 border-gray-300 dark:bg-gray-800/50 bg-white/80 backdrop-blur-sm transition-all hover:shadow-lg">
                    <h3 className="text-xl font-bold mb-3 dark:text-white text-gray-900">{card.title}</h3>
                    <p className="text-muted-foreground">{card.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <FAQ localeData={{
            title: t.home.faq.title,
            subtitle: t.home.faq.subtitle
          }} locale={locale} />
        </>
      )}

      {/* Features Page */}
      {path === 'features' && (
        <>
          {/* Hero Section */}
          <section className="relative pt-32 pb-20 z-10">
            <div className="container px-4 mx-auto">
              <div className="text-center mb-16">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-300 dark:to-blue-500 bg-clip-text text-transparent">
                  {t.features.hero.title}
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  {t.features.hero.subtitle}
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-700/50 bg-gray-900/90 backdrop-blur-sm transition-all hover:shadow-lg flex flex-col overflow-hidden"
                  >
                    {/* GIF Container */}
                    <div className="w-full aspect-video relative bg-gray-800/80">
                      <Image
                        src={feature.gifPlaceholder}
                        alt={feature.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Text Content */}
                    <div className="p-8 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                      <h4 className="text-lg text-blue-400 mb-3">{feature.subtitle}</h4>
                      <p className="text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Additional Features Section */}
          <section className="relative py-20 z-10">
            <div className="container px-4 mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">{t.features.whyChoose.title}</h2>
                <p className="text-xl text-muted-foreground">
                  {t.features.whyChoose.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                <div className="p-6 rounded-lg border bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
                  <h3 className="text-lg font-bold mb-2">{t.features.whyChoose.bestStoryGeneration.title}</h3>
                  <p className="text-muted-foreground">{t.features.whyChoose.bestStoryGeneration.description}</p>
                </div>
                <div className="p-6 rounded-lg border bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
                  <h3 className="text-lg font-bold mb-2">{t.features.whyChoose.advancedAnimation.title}</h3>
                  <p className="text-muted-foreground">{t.features.whyChoose.advancedAnimation.description}</p>
                </div>
                <div className="p-6 rounded-lg border bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
                  <h3 className="text-lg font-bold mb-2">{t.features.whyChoose.noTechnicalExperience.title}</h3>
                  <p className="text-muted-foreground">{t.features.whyChoose.noTechnicalExperience.description}</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative py-16 z-10">
            <div className="container px-4 mx-auto">
              <div className="max-w-3xl mx-auto text-center bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border p-8">
                <h2 className="text-2xl font-bold mb-4">{t.features.cta.title}</h2>
                <p className="text-muted-foreground mb-6">
                  {t.features.cta.description}
                </p>
                <div className="flex justify-center gap-4">
                  <Link href={links.signup}>
                    <Button className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
                      {t.features.cta.startFreeTrial}
                    </Button>
                  </Link>
                  <Link href={links.pricing}>
                    <Button variant="outline">{t.features.cta.viewPricing}</Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Pricing Page */}
      {path === 'pricing' && (
        <section className="relative pt-32 pb-20 z-10">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-300 dark:to-blue-500 bg-clip-text text-transparent">
                {t.pricing.hero.title}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t.pricing.hero.subtitle}
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-lg border bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm p-8 ${
                    plan.highlight
                      ? "relative border-blue-500 dark:border-blue-400 shadow-lg"
                      : "border-border"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 dark:bg-blue-400 text-white text-sm font-medium px-3 py-1 rounded-full shadow-md">
                        {plan.mostPopular}
                      </span>
                    </div>
                  )}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-2 dark:text-white">{plan.name}</h3>
                    <p className="text-muted-foreground">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                        ${plan.price}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <div key={feature.name} className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className={feature.included ? "dark:text-gray-200" : "text-muted-foreground"}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link href={plan.cta.href} className="block">
                    <Button
                      className={`w-full ${plan.highlight ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700' : ''}`}
                      variant={plan.highlight ? "default" : "outline"}
                    >
                      {plan.cta.text}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative border-t border-border/40 bg-muted/20 py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold">{t.common.title}</span>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href={links.terms}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
            <Link 
              href={links.privacy}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>

            {/* Language Switcher */}
            <div className="relative group">
              <button className="text-sm text-muted-foreground hover:text-foreground">
                {locale.toUpperCase()}
              </button>
              <div className="absolute right-0 mt-2 w-24 bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                {locales.map((l) => (
                  <Link 
                    key={l}
                    href={`/${l}/${slug.join('/')}`} 
                    className={`block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${l === locale ? 'font-bold' : ''}`}
                  >
                    {l.toUpperCase()}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 