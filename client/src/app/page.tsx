// app/page.tsx
import AboutUs from "@/components/AboutUs";
import Sliders from "@/components/Sliders";
import ContactUs from "@/components/ContactUs";
import Service from "@/components/Service";
import ServicesMarquee from "@/components/Servicesmarquee";
import VideoSlider from "@/components/VideoSlider";
import Footer from "@/components/Footer"
import VideoCom from "@/components/VideoCom"
import FeatureBlog from "@/components/FeatureBlog";
import FloatingControls from "@/components/FloatingControls";
import GigsCom from "@/components/GigsCom";

export default function Home() {
  return (
    <div className="bg-background">
      <FloatingControls />
      <VideoSlider/>
      <AboutUs />
      <VideoCom/>
      <Service />
      <ServicesMarquee />
      <GigsCom/>
      <FeatureBlog/>
      {/* <Sliders /> */}
      <ContactUs />
      <Footer/>
    </div>
  );
}