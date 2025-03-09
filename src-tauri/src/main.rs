// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Serialize, Deserialize};
use std::process::Command;

#[derive(Serialize, Deserialize, Debug)]
struct ScreenpipeAppSettings {
  example_setting: String,
  prompt: String,
  // add more fields as needed
}

#[tauri::command]
fn get_screenpipe_app_settings() -> Result<String, String> {
  println!("Called get_screenpipe_app_settings");
  println!("Current directory: {:?}", std::env::current_dir());

  let node_result = Command::new("node")
      .current_dir("/Users/kentdang/Projects/AI-Interview-Coach")
      .arg("screenpipe.js")
      .arg("get")
      .output();
      
  match node_result {
    Ok(output) => {
      println!("Command executed successfully");
      if output.status.success() {
        match String::from_utf8(output.stdout) {
          Ok(stdout) => {
            println!("Fetched settings: {}", &stdout);
            Ok(stdout)
          },
          Err(e) => {
            println!("Error parsing stdout: {}", e);
            Err(e.to_string())
          }
        }
      } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        println!("Command failed: {}", stderr);
        Err(stderr.into_owned())
      }
    },
    Err(e) => {
      println!("Failed to execute command: {}", e);
      Err(e.to_string())
    }
  }
}

#[tauri::command]
fn update_screenpipe_app_settings(new_settings: String) -> Result<(), String> {
  let output = Command::new("node")
      .current_dir("/Users/kentdang/Projects/AI-Interview-Coach") // adjust this path accordingly
      .arg("screenpipe.js")
      .arg("update")
      .arg(&new_settings)
      .output()
      .map_err(|e| e.to_string())?;
      
  if output.status.success() {
      println!("Update successful: {}", String::from_utf8_lossy(&output.stdout));
      Ok(())
  } else {
      let stderr = String::from_utf8_lossy(&output.stderr);
      Err(stderr.into_owned())
  }
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      get_screenpipe_app_settings,
      update_screenpipe_app_settings
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
