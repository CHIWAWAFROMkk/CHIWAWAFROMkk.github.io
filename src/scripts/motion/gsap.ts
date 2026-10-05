/** Register the shared plugins once; components own and clean up their animations. */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('site', '.2,.8,.2,1');
export { gsap, ScrollTrigger, SplitText };
