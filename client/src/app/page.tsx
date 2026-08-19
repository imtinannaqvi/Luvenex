import AboutUs from "@/components/AboutUs";
import Sliders from "@/components/Sliders";
import ContactUs from "@/components/ContactUs";
import Service from "@/components/Service";
import ServicesMarquee from "@/components/Servicesmarquee";
import VideoSlider from "@/components/VideoSlider";
import Footer from "@/components/Footer"
import VideoCom from "@/components/VideoCom"
import FeatureBlog from "@/components/FeatureBlog";


export default function Home() {
  return (
    <div className="bg-background">
      <VideoSlider/>
      <AboutUs />
      <VideoCom/>
      <Service />
      <ServicesMarquee />
      <FeatureBlog/>
      <Sliders />
      <ContactUs />
      <Footer/>
    </div>
  );
}