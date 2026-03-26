import { Outlet } from "react-router-dom";

const Onboarding = () => {
  return (
    <div>
      {/* Common layout like progress bar, header */}
      <Outlet />
    </div>
  );
};

export default Onboarding;