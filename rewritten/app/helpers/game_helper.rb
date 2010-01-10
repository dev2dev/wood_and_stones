module GameHelper
  def self.full_tile_path(file_code)
    File.join("", "images", "board", "temporary", "tile#{file_code}.png")
  end
  IMAGE_MAP = { :topleft => ({ nil => (full_tile_path("0nw")), "black" => (full_tile_path("1nw")), "white" => (full_tile_path("2nw")) }), :top => ({ nil => (full_tile_path("0n")), "black" => (full_tile_path("1n")), "white" => (full_tile_path("2n")) }), :topright => ({ nil => (full_tile_path("0ne")), "black" => (full_tile_path("1ne")), "white" => (full_tile_path("2ne")) }), :left => ({ nil => (full_tile_path("0w")), "black" => (full_tile_path("1w")), "white" => (full_tile_path("2w")) }), :right => ({ nil => (full_tile_path("0e")), "black" => (full_tile_path("1e")), "white" => (full_tile_path("2e")) }), :bottomleft => ({ nil => (full_tile_path("0sw")), "black" => (full_tile_path("1sw")), "white" => (full_tile_path("2sw")) }), :bottom => ({ nil => (full_tile_path("0s")), "black" => (full_tile_path("1s")), "white" => (full_tile_path("2s")) }), :bottomright => ({ nil => (full_tile_path("0se")), "black" => (full_tile_path("1se")), "white" => (full_tile_path("2se")) }), :blank => ({ nil => (full_tile_path("0")), "black" => (full_tile_path("1")), "white" => (full_tile_path("2")) }), :star => ({ nil => (full_tile_path("0c")), "black" => (full_tile_path("1")), "white" => (full_tile_path("2")) }) }
  def image_paths(board)
    board.map_array(IMAGE_MAP)
  end
end