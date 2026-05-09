import type { NextFunction, Request, Response } from "express";
import axios from "axios";
import { env } from "../config/env.js";
import { forbidden } from "../utils/errors.js";

export async function verifyCaptcha(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!env.HCAPTCHA_SECRET) {
    next();
    return;
  }
  const token = (req.body as { captchaToken?: string }).captchaToken;
  if (!token) {
    next(forbidden("Captcha required"));
    return;
  }
  try {
    const params = new URLSearchParams();
    params.set("secret", env.HCAPTCHA_SECRET);
    params.set("response", token);
    const { data } = await axios.post<{ success: boolean }>(
      "https://hcaptcha.com/siteverify",
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 5_000 },
    );
    if (!data.success) {
      next(forbidden("Captcha failed"));
      return;
    }
    next();
  } catch {
    next(forbidden("Captcha verification error"));
  }
}
