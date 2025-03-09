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
  // Set the working directory to your project root.
  println!("Current directory: {:?}", std::env::current_dir());

  let output = Command::new("node")
      .current_dir("/Users/kentdang/Projects/AI-Interview-Coach") // adjust this path accordingly
      .arg("/Users/kentdang/Projects/AI-Interview-Coach/screenpipe.js")
      .arg("get")
      .output()
      .map_err(|e| e.to_string())?;
      
      if output.status.success() {
        let stdout = String::from_utf8(output.stdout).map_err(|e| e.to_string())?;
        println!("Fetched settings: {}", stdout);
        Ok(stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        println!("Error output: {}", stderr);  // Log the error output
        Err(stderr.into_owned())
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
