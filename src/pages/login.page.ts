import { env } from "@config/env";
import { BaseComponent } from "./baseComponent";


export class Login extends BaseComponent {
    async doLogin(username: string, password: string) {
        await this.page.getByPlaceholder("Username").fill(username);
        await this.page.getByPlaceholder("Password").fill(password);
        await this.page.getByRole("button", {name: "Login"}).click();
}
    async openLoginPage() {
        await this.page.goto(env.baseUrl);
    }
}