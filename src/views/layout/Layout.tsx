import { createSignal, onCleanup, onMount } from 'solid-js';
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";
import { NavProvider } from '../../components/navbar/NavContext';

function Layout(props) {
  const [isMobile, setIsMobile] = createSignal(false);

  onMount(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    // set initial value
    setIsMobile(mediaQuery.matches);

    // listener for changes
    const handleChange = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    onCleanup(() => {
      mediaQuery.removeEventListener("change", handleChange);
    });
  });

  return (
    <NavProvider>
      {isMobile()
        ? <MobileLayout>{props.children}</MobileLayout>
        : <DesktopLayout>{props.children}</DesktopLayout>
      }
    </NavProvider>
  );
}

export default Layout;
