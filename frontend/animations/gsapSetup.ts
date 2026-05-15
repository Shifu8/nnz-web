/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * DescripciÃ³n: Registro seguro de GSAP para componentes cliente.
 */

"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);
gsap.defaults({ ease: "power3.out", duration: 0.8 });

export { gsap, ScrollTrigger, useGSAP };
