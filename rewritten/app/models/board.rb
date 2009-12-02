class Board < ActiveRecord::Base
  class Occupied < Exception
  end
  class Wtf < Exception
  end
  module Location
    attr_accessor(:board)
    def self.for(board, across, down)
      returning([across, down]) do |it|
        it.extend(self)
        it.board = board
      end
    end
    def across
      self.first
    end
    def down
      self.last
    end
    def open?
      self.board.to_a[self.across, self.down].blank?
    end
    def black?
      (self.board.to_a[self.across, self.down] == "black")
    end
    def white?
      (self.board.to_a[self.across, self.down] == "black")
    end
  end
  module Grouping
    attr_accessor(:board)
    def self.for(board, *locations)
      returning(locations) do |it|
        it.extend(self)
        it.board = board
      end
    end
    def self.groupings_for_one_colour(board, offsets)
      offsets.inject([]) do |groupings_so_far, offset|
        across, down = offset
        groupings_adjacent_to_this_stone = board.stone_adjacents(across, down).map do |adjacent_across, adjacent_down|
          groupings_so_far.detect do |it|
            it.include?([adjacent_across, adjacent_down])
          end
        end.compact
        if (groupings_adjacent_to_this_stone.size == 0) then
          (groupings_so_far << self.for(board, Location.for(board, across, down)))
        else
          if (groupings_adjacent_to_this_stone.size == 1) then
            (groupings_adjacent_to_this_stone.first << [across, down])
          else
            groupings_so_far = ((groupings_so_far - groupings_adjacent_to_this_stone) + [self.for(board, (groupings_adjacent_to_this_stone.inject(&:+) + [Location.for(board, across, down)]))])
          end
        end
        groupings_so_far
      end
    end
    def liberties
      self.inject([]) do |libs, offsets|
        (libs + self.board.stone_liberties(*offsets))
      end
    end
    def alive?
      self.detect { |it| (not self.board.stone_liberties(*it).empty?) }
    end
    def dead?
      (not self.alive?)
    end
  end
  validates_inclusion_of(:dimension, :in => ([9, 11, 13, 15, 17, 19]))
  before_create(:initialize_sgf_hack)
  def self.initial(options = {  })
    self.create(options)
  end
  LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S"]
  SGF_BLACK_PLACEMENT_PROPERTIES = ["B", "AB"]
  SGF_WHITE_PLACEMENT_PROPERTIES = ["W", "AW"]
  def valid_position?(str)
    (not (not parse_position(str)))
  end
  def [](str_or_symbol)
    str = str_or_symbol.to_s.downcase
    if valid_position?(str) then
      SGF_BLACK_PLACEMENT_PROPERTIES.each do |property|
        if ((__125972535561327__ = self.sgf_hack and __125972535561327__.index(";#{property}[#{str}]")) or (__125972535552425__ = self.sgf_hack and __125972535552425__.index("]#{property}[#{str}]"))) then
          return "black"
        end
      end
      SGF_WHITE_PLACEMENT_PROPERTIES.each do |property|
        if ((__12597253551935__ = self.sgf_hack and __12597253551935__.index(";#{property}[#{str}]")) or (__125972535557188__ = self.sgf_hack and __125972535557188__.index("]#{property}[#{str}]"))) then
          return "white"
        end
      end
      return nil
    else
      super(str_or_symbol)
    end
  end
  def []=(str_or_symbol, value)
    str = str_or_symbol.to_s.downcase
    if valid_position?(str) then
      (SGF_BLACK_PLACEMENT_PROPERTIES + SGF_WHITE_PLACEMENT_PROPERTIES).each do |property|
        if ((__125972535576546__ = self.sgf_hack and __125972535576546__.index(";#{property}[#{str}]")) or (__12597253555215__ = self.sgf_hack and __12597253555215__.index("]#{property}[#{str}]"))) then
          raise(Occupied.new(str))
        end
      end
      self.sgf_hack = ((self.sgf_hack or "") + if (value == "black") then
        ";B[#{str}]"
      else
        if (value == "white") then
          ";W[#{str}]"
        else
          raise(Wtf.new("What is a #{value}?"))
        end
      end)
    else
      super(str_or_symbol)
    end
  end
  def to_a
    lambda do |arr|
      ["black", "white"].zip(self.stone_offsets).each do |colour, list_of_offsets|
        list_of_offsets.each { |across, down| arr[across][down] = colour }
      end
      arr
    end.call((1..self.dimension).map { ([nil] * self.dimension) })
  end
  def groupings
    black_offsets, white_offsets = self.stone_offsets
    [Grouping.groupings_for_one_colour(self, black_offsets), Grouping.groupings_for_one_colour(self, white_offsets)]
  end
  def dead_groupings
    self.groupings.map do |groupings_of_one_colour|
      groupings_of_one_colour.select { |its| its.dead? }
    end
  end
  def dead_stones
    self.dead_groupings.map { |it| it.inject([], &:+) }
  end
  def stone_offsets
    returning([[], []]) do |blacks, whites|
      self.sgf_hack.scan(/([BW])\[([abcdefghijklmnopqrs][abcdefghijklmnopqrs])\]/) do |initial, position|
        if (initial == "B") then
          (blacks << parse_position(position))
        else
          (whites << parse_position(position))
        end
      end
    end
  end
  def adjacent_scalars(offset)
    if (offset == 0) then
      [(offset + 1)]
    else
      if (offset == (self.dimension - 1)) then
        [(offset - 1)]
      else
        [(offset + 1), (offset - 1)]
      end
    end
  end
  def stone_adjacents(across, down)
    (adjacent_scalars(across).map { |it| [it, down] } + adjacent_scalars(down).map { |it| [across, it] })
  end
  def stone_liberties(across, down)
    stone_adjacents(across, down).select do |adjacent_across, adjacent_down|
      self.to_a[adjacent_across][adjacent_down].blank?
    end
  end
  def parse_position(str)
    offsets = str.scan(/[abcdefghijklmnopqrst]/i).map { |its| LETTERS.index(its.upcase) }.select do |it|
      (it and ((it >= 0) and (it < dimension)))
    end
    [offsets.first, offsets.last] if (offsets.size == 2)
  end
  def initialize_sgf_hack
    self.sgf_hack ||= ""
  end
end