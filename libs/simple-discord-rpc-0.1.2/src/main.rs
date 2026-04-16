// This file was generated using AI as I don't know any rust sorry :/
// I know people hate on using AI but when used correctly its not too bad. The discord RPC isn't exactly a high risk peice of code.
// Don't worry i fed the following code into AI to get this: https://github.com/DaBigBlob/simple-discord-rpc/blob/main/src/main.rs

use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use serde::Deserialize;
use std::io::{self, BufRead};

#[derive(Deserialize, Debug)]
struct RpcPayload {
    state: Option<String>,
    details: Option<String>,
    large_image_key: Option<String>,
    large_image_text: Option<String>,
    small_image_key: Option<String>,
    small_image_text: Option<String>,
    button1_label: Option<String>,
    button1_url: Option<String>,
    button2_label: Option<String>,
    button2_url: Option<String>,
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        eprintln!("[ER] No Client ID provided.");
        std::process::exit(1);
    }
    let client_id = &args[1];

    let mut client = match DiscordIpcClient::new(client_id) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("[ER] Failed to create client: {}", e);
            std::process::exit(1);
        }
    };

    if let Err(e) = client.connect() {
        eprintln!("[ER] Failed to connect: {}", e);
        std::process::exit(1);
    }

    println!("[OK] Connected to Discord.");

    let stdin = io::stdin();
    for line in stdin.lock().lines() {
        let raw_line = match line {
            Ok(l) => l,
            Err(_) => break,
        };

        if raw_line.trim().is_empty() { continue; }

        let payload: RpcPayload = match serde_json::from_str(&raw_line) {
            Ok(p) => p,
            Err(e) => {
                eprintln!("[ER] Failed to parse JSON: {}", e);
                continue;
            }
        };

        let mut activity = activity::Activity::new();

        if let Some(s) = payload.state.as_deref().filter(|s| !s.is_empty()) {
            activity = activity.state(s);
        }
        if let Some(d) = payload.details.as_deref().filter(|d| !d.is_empty()) {
            activity = activity.details(d);
        }

        let mut assets = activity::Assets::new();
        let mut has_assets = false;

        if let Some(k) = payload.large_image_key.as_deref().filter(|s| !s.is_empty()) {
            assets = assets.large_image(k);
            has_assets = true;
        }
        if let Some(t) = payload.large_image_text.as_deref().filter(|s| !s.is_empty()) {
            assets = assets.large_text(t);
            has_assets = true;
        }
        if let Some(k) = payload.small_image_key.as_deref().filter(|s| !s.is_empty()) {
            assets = assets.small_image(k);
            has_assets = true;
        }
        if let Some(t) = payload.small_image_text.as_deref().filter(|s| !s.is_empty()) {
            assets = assets.small_text(t);
            has_assets = true;
        }

        if has_assets {
            activity = activity.assets(assets);
        }

        let mut buttons = Vec::new();
        
        if let (Some(l), Some(u)) = (&payload.button1_label, &payload.button1_url) {
            if !l.is_empty() && !u.is_empty() {
                buttons.push(activity::Button::new(l, u));
            }
        }
        if let (Some(l), Some(u)) = (&payload.button2_label, &payload.button2_url) {
            if !l.is_empty() && !u.is_empty() {
                buttons.push(activity::Button::new(l, u));
            }
        }

        if !buttons.is_empty() {
            activity = activity.buttons(buttons);
        }

        if let Err(e) = client.set_activity(activity) {
            eprintln!("[ER] Failed to update: {}", e);
        } else {
            println!("[OK] Activity updated.");
        }
    }

    let _ = client.close();
}