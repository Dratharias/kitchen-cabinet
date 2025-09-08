import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";
import { NavProvider } from '../../components/navbar/NavContext'; 
import { createSignal, onMount, onCleanup } from "solid-js";

function Layout(props) {
  const [isMobile, setIsMobile] = createSignal(false);

  onMount(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    setIsMobile(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    onCleanup(() => mediaQuery.removeEventListener("change", handleChange));
  });

  return (
    <NavProvider>
      {isMobile()
        ? <MobileLayout>{props.children}</MobileLayout>
        : <DesktopLayout>{props.children}</DesktopLayout>}
    </NavProvider>
  );
}

export default Layout;