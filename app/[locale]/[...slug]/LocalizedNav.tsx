"use client";

import React from "react";
import Nav from "../../components/LocalizedNav";
import { Locale } from "../../locales";

interface LocalizedNavProps {
  locale: Locale;
  path: string;
  translations: any;
  links: {
    home: string;
    features: string;
    pricing: string;
    signin: string;
    signup: string;
    terms: string;
    privacy: string;
  };
}

export default function LocalizedNav(props: LocalizedNavProps) {
  return <Nav {...props} />;
} 