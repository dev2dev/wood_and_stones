class Secret < ActiveRecord::Base
  belongs_to(:user)
  belongs_to(:target, :polymorphic => (true))
  validates_uniqueness_of(:secret)
  validates_presence_of(:secret)
  before_validation_on_create(:assign_secret)
  has_many(:notifications, :as => :subject, :class_name => "Notification::Base")
  named_scope(:for_user, lambda { |user| { :conditions => ({ :user_id => (user.id) }) } })
  def assign_secret
    self.secret = shortened((1000000 + rand(9999999)))
    true
  end
  private
  URL_CHARS = ((("0".."9").to_a + ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "x", "y", "z"]) + ["B", "C", "D", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "X", "Y", "Z", "-", "_"])
  URL_BASE = URL_CHARS.size
  def shortened(num)
    localCount = num
    result = ""
    until (localCount == 0) do
      (remainder = (localCount % URL_BASE)
      localCount = ((localCount - remainder) / URL_BASE)
      result = (URL_CHARS[remainder] + result))
    end
    result
  end
end