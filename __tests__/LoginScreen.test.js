import { fireEvent, render } from "@testing-library/react-native";
import LoginScreen from "../src/screens/LoginScreen";

// ---------------------------------------------------------
// LA SOLUTION EST ICI : On "mock" (simule) Firebase
// ---------------------------------------------------------
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: { uid: "123" } }),
  ),
}));

jest.mock("../src/services/firebaseConfig", () => ({
  auth: {},
  db: {},
  storage: {},
}));
// ---------------------------------------------------------

// On simule la navigation
const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
};

describe("LoginScreen Component", () => {
  it("doit afficher les champs email et mot de passe", () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />,
    );

    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByText("Log In")).toBeTruthy();
  });

  it("doit déclencher une erreur si les champs sont vides au clic du bouton", () => {
    const alertSpy = jest.spyOn(
      global.Alert || require("react-native").Alert,
      "alert",
    );
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

    fireEvent.press(getByText("Log In"));

    expect(alertSpy).toHaveBeenCalledWith(
      "Error",
      "Please fill in all fields.",
    );
  });
});
